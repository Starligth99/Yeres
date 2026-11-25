import json
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Count
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods, require_POST

from .models import Alert, Client, CustomsReview, InventoryItem, Operation, OperationDocument


RISK_FIELDS = {
    "delay": "risk_delay",
    "damage": "risk_damage",
    "customs": "risk_customs",
    "weather": "risk_weather",
    "loss": "risk_loss",
}


def _relative_time(value):
    elapsed = max(0, int((timezone.now() - value).total_seconds()))
    if elapsed < 60:
        return "Hace un momento"
    if elapsed < 3600:
        return f"Hace {elapsed // 60} min"
    if elapsed < 86400:
        return f"Hace {elapsed // 3600} h"
    return f"Hace {elapsed // 86400} días"


def serialize_operation(operation):
    return {
        "id": operation.reference,
        "client": operation.client.name,
        "origin": operation.origin,
        "destination": operation.destination,
        "transport": operation.transport,
        "status": operation.status,
        "progress": operation.progress,
        "eta": operation.eta,
        "updated": _relative_time(operation.updated_at),
        "item": operation.item,
        "recipient": operation.recipient,
        "address": operation.address,
        "quantity": operation.quantity,
        "price": float(operation.unit_price),
        "originCoords": _coordinates(operation.origin_latitude, operation.origin_longitude),
        "coords": _coordinates(operation.latitude, operation.longitude),
        "risk": {
            "delay": operation.risk_delay,
            "damage": operation.risk_damage,
            "customs": operation.risk_customs,
            "weather": operation.risk_weather,
            "loss": operation.risk_loss,
        },
        "createdAt": operation.created_at.isoformat(),
    }


def _coordinates(latitude, longitude):
    if latitude is None or longitude is None:
        return None
    return [float(latitude), float(longitude)]


def serialize_client(client):
    return {
        "name": client.name,
        "country": client.country,
        "contact": client.contact,
        "email": client.email,
        "operations": client.operations.count(),
        "status": client.status,
    }


def serialize_alert(alert):
    return {
        "id": alert.reference,
        "title": alert.title,
        "operation": alert.operation.reference if alert.operation else "Sin embarque",
        "severity": alert.severity,
        "area": alert.area,
        "time": _relative_time(alert.updated_at),
        "open": alert.is_open,
    }


def serialize_customs(review):
    return {
        "reference": review.reference,
        "operation": review.operation.reference if review.operation else "",
        "type": review.declaration_type,
        "office": review.customs_office,
        "status": review.status,
        "updated": _relative_time(review.updated_at),
        "note": review.note,
    }


def serialize_inventory_item(item):
    if item.quantity == 0:
        stock_status = "Agotado"
    elif item.quantity <= item.low_stock_threshold:
        stock_status = "Bajo"
    else:
        stock_status = "Disponible"
    return {
        "id": item.pk,
        "sku": item.sku,
        "name": item.name,
        "category": item.category,
        "quantity": item.quantity,
        "unit": item.unit,
        "lowStockThreshold": item.low_stock_threshold,
        "location": item.location,
        "coords": _coordinates(item.latitude, item.longitude),
        "status": stock_status,
        "updated": _relative_time(item.updated_at),
        "createdAt": item.created_at.isoformat(),
    }


def _read_json(request):
    try:
        data = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise ValueError("El cuerpo de la solicitud no contiene JSON válido.") from error
    if not isinstance(data, dict):
        raise ValueError("Se esperaba un objeto JSON.")
    return data


def _error(message, status=400):
    return JsonResponse({"error": message}, status=status)


def _decimal(value, field_name):
    try:
        parsed = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError) as error:
        raise ValueError(f"El campo {field_name} debe ser numérico.") from error
    if not parsed.is_finite():
        raise ValueError(f"El campo {field_name} debe ser un número finito.")
    return parsed


def _coordinate_pair(value, label):
    if value in (None, ""):
        return None, None
    if not isinstance(value, list) or len(value) != 2:
        raise ValueError(f"Las coordenadas de {label} no son válidas.")
    latitude = _decimal(value[0], f"latitud de {label}")
    longitude = _decimal(value[1], f"longitud de {label}")
    if not Decimal("-90") <= latitude <= Decimal("90") or not Decimal("-180") <= longitude <= Decimal("180"):
        raise ValueError(f"Las coordenadas de {label} están fuera de rango.")
    return latitude, longitude


@ensure_csrf_cookie
def dashboard(request):
    operations = list(Operation.objects.select_related("client").prefetch_related("documents"))
    clients = list(Client.objects.annotate(operation_count=Count("operations")).order_by("name"))
    alerts = list(Alert.objects.select_related("operation"))
    customs = list(CustomsReview.objects.select_related("operation"))
    inventory = list(InventoryItem.objects.all())
    checked_documents = {}
    for document in OperationDocument.objects.filter(checked=True).values("operation__reference", "mode", "document_index"):
        operation_ref = document["operation__reference"]
        checked_documents.setdefault(operation_ref, {}).setdefault(document["mode"], []).append(document["document_index"])

    dashboard_data = {
        "operations": [serialize_operation(operation) for operation in operations],
        "clients": [
            {
                "name": client.name,
                "country": client.country,
                "contact": client.contact,
                "email": client.email,
                "operations": client.operation_count,
                "status": client.status,
            }
            for client in clients
        ],
        "alerts": [serialize_alert(alert) for alert in alerts],
        "customs": [serialize_customs(review) for review in customs],
        "inventory": [serialize_inventory_item(item) for item in inventory],
        "checkedDocuments": checked_documents,
    }
    return render(
        request,
        "operations/index.html",
        {
            "dashboard_data": dashboard_data,
            "carto_basemap_api_key": settings.CARTO_BASEMAP_API_KEY,
        },
    )


@require_http_methods(["GET", "POST"])
def inventory_api(request):
    if request.method == "GET":
        items = InventoryItem.objects.all()
        return JsonResponse({"inventory": [serialize_inventory_item(item) for item in items]})

    try:
        data = _read_json(request)
        sku = str(data.get("sku", "")).strip()
        name = str(data.get("name", "")).strip()
        category = str(data.get("category") or InventoryItem.Category.GENERAL).strip()
        unit = str(data.get("unit") or InventoryItem.Unit.PIECE).strip()
        location = str(data.get("location", "")).strip()
        if not sku or len(sku) > 60:
            raise ValueError("El SKU es obligatorio y debe tener hasta 60 caracteres.")
        if not name or len(name) > 180:
            raise ValueError("El nombre es obligatorio y debe tener hasta 180 caracteres.")
        if category not in InventoryItem.Category.values:
            raise ValueError("La categoría de inventario no es válida.")
        if unit not in InventoryItem.Unit.values:
            raise ValueError("La unidad de inventario no es válida.")
        if len(location) > 220:
            raise ValueError("La ubicación debe tener hasta 220 caracteres.")
        quantity = int(data.get("quantity", 0))
        low_stock_threshold = int(data.get("lowStockThreshold", 5))
        if quantity < 0 or low_stock_threshold < 0:
            raise ValueError("Las existencias y el mínimo de inventario no pueden ser negativos.")
        latitude, longitude = _coordinate_pair(data.get("coords"), "inventario")
        item = InventoryItem.objects.create(
            sku=sku,
            name=name,
            category=category,
            quantity=quantity,
            unit=unit,
            low_stock_threshold=low_stock_threshold,
            location=location,
            latitude=latitude,
            longitude=longitude,
        )
    except (ValueError, TypeError) as error:
        return _error(str(error))
    except IntegrityError:
        return _error("Ya existe un producto con ese SKU.", status=409)
    return JsonResponse({"item": serialize_inventory_item(item)}, status=201)


@require_POST
def inventory_stock_api(request, item_id):
    item = get_object_or_404(InventoryItem, pk=item_id)
    try:
        data = _read_json(request)
        quantity = int(data.get("quantity", -1))
        if quantity < 0:
            raise ValueError("Las existencias no pueden ser negativas.")
    except (ValueError, TypeError) as error:
        return _error(str(error))
    item.quantity = quantity
    item.save(update_fields=["quantity", "updated_at"])
    return JsonResponse({"item": serialize_inventory_item(item)})


@require_http_methods(["GET", "POST"])
def operations_api(request):
    if request.method == "GET":
        items = Operation.objects.select_related("client").all()
        return JsonResponse({"operations": [serialize_operation(item) for item in items]})

    try:
        data = _read_json(request)
        required = ("client", "item", "origin", "destination", "transport")
        values = {key: str(data.get(key, "")).strip() for key in required}
        if any(not value for value in values.values()):
            raise ValueError("Completa cliente, mercancía, origen, destino y transporte.")
        if values["transport"] not in Operation.Transport.values:
            raise ValueError("El medio de transporte no es válido.")

        quantity = int(data.get("quantity", 1))
        if quantity < 1:
            raise ValueError("La cantidad debe ser al menos 1.")
        unit_price = _decimal(data.get("price", 0), "precio")
        if unit_price < 0:
            raise ValueError("El precio no puede ser negativo.")
        origin_lat, origin_lon = _coordinate_pair(data.get("originCoords"), "origen")
        lat, lon = _coordinate_pair(data.get("coords"), "destino")

        with transaction.atomic():
            client, _ = Client.objects.get_or_create(
                name=values["client"],
                defaults={
                    "country": "Por confirmar",
                    "contact": str(data.get("recipient") or "Por confirmar").strip(),
                },
            )
            latest = Operation.objects.filter(reference__startswith="HB-").order_by("-reference").values_list("reference", flat=True).first()
            next_number = int(latest.rsplit("-", 1)[-1]) + 1 if latest else 24001
            operation = Operation.objects.create(
                reference=f"HB-{next_number}",
                client=client,
                item=values["item"],
                origin=values["origin"],
                destination=values["destination"],
                transport=values["transport"],
                status=Operation.Status.PREPARATION,
                progress=8,
                eta="Por estimar",
                recipient=str(data.get("recipient") or "Por confirmar").strip(),
                address=str(data.get("address") or values["destination"]).strip(),
                quantity=quantity,
                unit_price=unit_price,
                origin_latitude=origin_lat,
                origin_longitude=origin_lon,
                latitude=lat,
                longitude=lon,
            )
        return JsonResponse(
            {"operation": serialize_operation(operation), "client": serialize_client(client)},
            status=201,
        )
    except ValueError as error:
        return _error(str(error))
    except IntegrityError:
        return _error("No se pudo asignar una referencia única. Intenta de nuevo.", status=409)


@require_POST
def advance_operation_api(request, reference):
    operation = get_object_or_404(Operation.objects.select_related("client"), reference=reference)
    operation.progress = min(100, operation.progress + 15)
    if operation.progress == 100:
        operation.status = Operation.Status.ARRIVED
        operation.eta = "Entregado"
    elif operation.progress < 20:
        operation.status = Operation.Status.PREPARATION
        operation.eta = "Por estimar"
    else:
        operation.status = Operation.Status.IN_TRANSIT
        operation.eta = f"{max(1, round((100 - operation.progress) / 8))} h"
    operation.save(update_fields=["progress", "status", "eta", "updated_at"])
    return JsonResponse({"operation": serialize_operation(operation)})


@require_http_methods(["GET", "POST"])
def clients_api(request):
    if request.method == "GET":
        items = Client.objects.annotate(operation_count=Count("operations")).order_by("name")
        return JsonResponse({
            "clients": [
                {
                    "name": item.name,
                    "country": item.country,
                    "contact": item.contact,
                    "email": item.email,
                    "operations": item.operation_count,
                    "status": item.status,
                }
                for item in items
            ]
        })
    try:
        data = _read_json(request)
        name = str(data.get("name", "")).strip()
        country = str(data.get("country", "")).strip()
        contact = str(data.get("contact", "")).strip()
        email = str(data.get("email", "")).strip()
        if not name or not country or not contact:
            raise ValueError("Nombre, país y persona de contacto son obligatorios.")
        if len(name) > 180:
            raise ValueError("El nombre del cliente es demasiado largo.")
        client = Client.objects.create(name=name, country=country, contact=contact, email=email)
    except ValueError as error:
        return _error(str(error))
    except IntegrityError:
        return _error("Ya existe un cliente con ese nombre.", status=409)
    return JsonResponse({"client": serialize_client(client)}, status=201)


@require_POST
def toggle_alert_api(request, reference):
    alert = get_object_or_404(Alert.objects.select_related("operation"), reference=reference)
    alert.is_open = not alert.is_open
    alert.save(update_fields=["is_open", "updated_at"])
    return JsonResponse({"alert": serialize_alert(alert)})


@require_POST
def resolve_all_alerts_api(request):
    updated = Alert.objects.filter(is_open=True).update(is_open=False, updated_at=timezone.now())
    return JsonResponse({"updated": updated})


@require_http_methods(["GET", "POST"])
def customs_api(request):
    if request.method == "GET":
        return JsonResponse({"customs": [serialize_customs(item) for item in CustomsReview.objects.select_related("operation")]})
    try:
        data = _read_json(request)
        operation = None
        operation_ref = str(data.get("operation", "")).strip()
        if operation_ref:
            operation = get_object_or_404(Operation, reference=operation_ref)
        declaration_type = str(data.get("type") or "Revisión documental").strip()
        customs_office = str(data.get("office") or "Por asignar").strip()
        note = str(data.get("note", "")).strip()
        if not declaration_type or len(declaration_type) > 160:
            raise ValueError("El tipo de declaración debe tener entre 1 y 160 caracteres.")
        if not customs_office or len(customs_office) > 120:
            raise ValueError("La aduana debe tener entre 1 y 120 caracteres.")
        current_year = timezone.localdate().year
        latest = CustomsReview.objects.filter(reference__startswith=f"AD-{current_year}-").order_by("-reference").values_list("reference", flat=True).first()
        next_number = int(latest.rsplit("-", 1)[-1]) + 1 if latest else 1
        review = CustomsReview.objects.create(
            reference=f"AD-{current_year}-{next_number:04d}",
            operation=operation,
            declaration_type=declaration_type,
            customs_office=customs_office,
            status=CustomsReview.Status.REVIEW,
            note=note,
        )
    except (ValueError, IntegrityError) as error:
        return _error("No se pudo registrar la revisión aduanera.", status=409 if isinstance(error, IntegrityError) else 400)
    return JsonResponse({"customsReview": serialize_customs(review)}, status=201)


@require_http_methods(["PUT"])
def customs_detail_api(request, reference):
    review = get_object_or_404(CustomsReview.objects.select_related("operation"), reference=reference)
    try:
        data = _read_json(request)
        if "operation" in data:
            operation_ref = str(data["operation"]).strip()
            review.operation = get_object_or_404(Operation, reference=operation_ref) if operation_ref else None
        if "type" in data:
            declaration_type = str(data["type"]).strip()
            if not declaration_type or len(declaration_type) > 160:
                raise ValueError("El tipo de declaración debe tener entre 1 y 160 caracteres.")
            review.declaration_type = declaration_type
        if "office" in data:
            customs_office = str(data["office"]).strip()
            if not customs_office or len(customs_office) > 120:
                raise ValueError("La aduana debe tener entre 1 y 120 caracteres.")
            review.customs_office = customs_office
        if "note" in data:
            review.note = str(data["note"]).strip()
        if "status" in data:
            if data["status"] not in CustomsReview.Status.values:
                raise ValueError("El estado de la revisión no es válido.")
            review.status = data["status"]
    except ValueError as error:
        return _error(str(error))
    review.save()
    return JsonResponse({"customsReview": serialize_customs(review)})


@require_POST
def documents_api(request):
    try:
        data = _read_json(request)
        operation = get_object_or_404(Operation, reference=str(data.get("operation", "")))
        mode = str(data.get("mode", ""))
        index = int(data.get("index", -1))
        name = str(data.get("name", "")).strip()
        if mode not in OperationDocument.Mode.values or index < 0 or index > 50 or not name or len(name) > 220:
            raise ValueError("Los datos del documento no son válidos.")
        document, _ = OperationDocument.objects.update_or_create(
            operation=operation,
            mode=mode,
            document_index=index,
            defaults={"document_name": name, "checked": bool(data.get("checked"))},
        )
    except (ValueError, TypeError) as error:
        return _error(str(error))
    return JsonResponse({
        "operation": operation.reference,
        "mode": document.mode,
        "index": document.document_index,
        "checked": document.checked,
    })


@require_POST
def risks_api(request):
    try:
        data = _read_json(request)
        operation = get_object_or_404(Operation, reference=str(data.get("operation", "")))
        key = str(data.get("key", ""))
        if key not in RISK_FIELDS:
            raise ValueError("El tipo de riesgo no es válido.")
        value = int(data.get("value", -1))
        if not 0 <= value <= 100:
            raise ValueError("El riesgo debe estar entre 0 y 100.")
    except (ValueError, TypeError) as error:
        return _error(str(error))
    field = RISK_FIELDS[key]
    setattr(operation, field, value)
    operation.save(update_fields=[field, "updated_at"])
    return JsonResponse({"operation": operation.reference, "key": key, "value": value})
