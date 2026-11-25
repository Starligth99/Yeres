from django.db import migrations


def seed_demo_data(apps, schema_editor):
    Client = apps.get_model("operations", "Client")
    Operation = apps.get_model("operations", "Operation")
    Alert = apps.get_model("operations", "Alert")
    CustomsReview = apps.get_model("operations", "CustomsReview")

    if Operation.objects.exists():
        return

    clients = {
        "Comercializadora del Centro": Client.objects.create(
            name="Comercializadora del Centro",
            country="México",
            contact="Ana López",
            status="Activo",
        ),
        "North Trade Supplies": Client.objects.create(
            name="North Trade Supplies",
            country="Estados Unidos",
            contact="Carlos Méndez",
            status="Activo",
        ),
        "Industrias del Bajío": Client.objects.create(
            name="Industrias del Bajío",
            country="México",
            contact="Lucía Torres",
            status="Activo",
        ),
        "Pacific Components": Client.objects.create(
            name="Pacific Components",
            country="Alemania",
            contact="Jorge Ruiz",
            status="Revisión",
        ),
    }

    operations = [
        {
            "reference": "HB-24018", "client": "Comercializadora del Centro",
            "origin": "Shanghai, China", "destination": "Manzanillo, México", "transport": "Marítimo",
            "status": "En tránsito", "progress": 68, "eta": "12 h", "item": "Licuadoras industriales",
            "recipient": "Ana López", "address": "Manzanillo, Colima", "quantity": 3, "unit_price": "4250.00",
            "origin_latitude": "31.230000", "origin_longitude": "121.470000",
            "latitude": "19.050000", "longitude": "-104.320000",
        },
        {
            "reference": "HB-24021", "client": "North Trade Supplies",
            "origin": "Laredo, Estados Unidos", "destination": "Monterrey, México", "transport": "Terrestre",
            "status": "En tránsito", "progress": 82, "eta": "3 h", "item": "Refacciones de maquinaria",
            "recipient": "Carlos Méndez", "address": "Monterrey, Nuevo León", "quantity": 12, "unit_price": "980.00",
            "origin_latitude": "27.510000", "origin_longitude": "-99.510000",
            "latitude": "25.680000", "longitude": "-100.310000",
        },
        {
            "reference": "HB-24009", "client": "Industrias del Bajío",
            "origin": "Veracruz, México", "destination": "Puebla, México", "transport": "Terrestre",
            "status": "Incidencia", "progress": 46, "eta": "En revisión", "item": "Componentes electrónicos",
            "recipient": "Lucía Torres", "address": "Puebla, Puebla", "quantity": 8, "unit_price": "2150.00",
            "origin_latitude": "19.170000", "origin_longitude": "-96.130000",
            "latitude": "19.040000", "longitude": "-98.200000",
        },
        {
            "reference": "HB-24014", "client": "Pacific Components",
            "origin": "Frankfurt, Alemania", "destination": "Ciudad de México, México", "transport": "Aéreo",
            "status": "En destino", "progress": 100, "eta": "Entregado", "item": "Sensores industriales",
            "recipient": "Jorge Ruiz", "address": "Ciudad de México", "quantity": 20, "unit_price": "1450.00",
            "origin_latitude": "50.110000", "origin_longitude": "8.680000",
            "latitude": "19.430000", "longitude": "-99.130000",
        },
        {
            "reference": "HB-24025", "client": "Comercializadora del Centro",
            "origin": "Querétaro, México", "destination": "Toluca, México", "transport": "Ferroviario",
            "status": "En tránsito", "progress": 55, "eta": "6 h", "item": "Equipo de cocina",
            "recipient": "Ana López", "address": "Toluca, Estado de México", "quantity": 5, "unit_price": "3200.00",
            "origin_latitude": "20.590000", "origin_longitude": "-100.390000",
            "latitude": "19.290000", "longitude": "-99.650000",
        },
    ]

    for data in operations:
        client = clients[data.pop("client")]
        Operation.objects.create(client=client, **data)

    alerts = [
        ("AL-038", "HB-24009", "Demora en inspección documental", "Alta", "Aduana"),
        ("AL-037", "HB-24021", "Confirmar actualización de ruta", "Media", "Transporte"),
        ("AL-036", "HB-24018", "Documento complementario pendiente", "Media", "Documentación"),
    ]
    for reference, operation_ref, title, severity, area in alerts:
        Alert.objects.create(
            reference=reference,
            operation=Operation.objects.get(reference=operation_ref),
            title=title,
            severity=severity,
            area=area,
        )

    customs = [
        ("AD-2026-0042", "HB-24018", "Importación marítima", "Manzanillo", "En revisión"),
        ("AD-2026-0041", "HB-24009", "Importación terrestre", "Puebla", "Retenido"),
        ("AD-2026-0040", "HB-24014", "Importación aérea", "AICM", "Liberado"),
        ("AD-2026-0039", "HB-24025", "Tránsito ferroviario", "Toluca", "Pendiente"),
    ]
    for reference, operation_ref, declaration_type, office, status in customs:
        CustomsReview.objects.create(
            reference=reference,
            operation=Operation.objects.get(reference=operation_ref),
            declaration_type=declaration_type,
            customs_office=office,
            status=status,
        )


class Migration(migrations.Migration):
    dependencies = [("operations", "0001_initial")]

    operations = [
        migrations.RunPython(seed_demo_data, migrations.RunPython.noop),
    ]
