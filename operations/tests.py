from decimal import Decimal

from django.test import TestCase, override_settings

from .models import Alert, Client, CustomsReview, InventoryItem, Operation, OperationDocument


class PersistentApiTests(TestCase):
    def setUp(self):
        self.client_record = Client.objects.create(
            name="Cliente de prueba",
            country="México",
            contact="Ana Prueba",
        )
        self.operation = Operation.objects.create(
            reference="HB-24001",
            client=self.client_record,
            item="Caja de prueba",
            origin="Puebla, México",
            destination="Mérida, México",
            transport=Operation.Transport.ROAD,
            progress=20,
            status=Operation.Status.IN_TRANSIT,
        )

    def test_login_page_has_required_password_field(self):
        response = self.client.get("/")

        self.assertContains(
            response,
            '<input id="password" name="password" type="password"',
            html=False,
        )
        self.assertContains(response, "La contraseña no se valida ni se guarda")

    @override_settings(CARTO_BASEMAP_API_KEY="carto-test-key")
    def test_dashboard_exposes_configured_carto_basemap_key_to_template(self):
        response = self.client.get("/")

        self.assertContains(response, '"carto-test-key"', html=False)

    def test_create_operation_is_stored_in_database(self):
        response = self.client.post(
            "/api/operations/",
            data={
                "client": "Nueva empresa",
                "item": "Licuadora",
                "origin": "Puebla",
                "destination": "Mérida",
                "transport": "Terrestre",
                "quantity": 2,
                "price": "1299.50",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        created = Operation.objects.get(reference=response.json()["operation"]["id"])
        self.assertEqual(created.item, "Licuadora")
        self.assertEqual(created.quantity, 2)
        self.assertEqual(str(created.unit_price), "1299.50")
        self.assertTrue(Client.objects.filter(name="Nueva empresa").exists())

    def test_advance_persists_operation_progress(self):
        response = self.client.post(f"/api/operations/{self.operation.reference}/advance/")

        self.assertEqual(response.status_code, 200)
        self.operation.refresh_from_db()
        self.assertEqual(self.operation.progress, 35)
        self.assertEqual(self.operation.status, Operation.Status.IN_TRANSIT)

    def test_document_checklist_is_persisted_by_operation_and_mode(self):
        response = self.client.post(
            "/api/documents/",
            data={
                "operation": self.operation.reference,
                "mode": "Terrestre",
                "index": 0,
                "name": "Carta porte",
                "checked": True,
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            OperationDocument.objects.get(
                operation=self.operation,
                mode="Terrestre",
                document_index=0,
            ).checked
        )

    def test_invalid_operation_coordinates_are_rejected(self):
        operation_count = Operation.objects.count()
        response = self.client.post(
            "/api/operations/",
            data={
                "client": "Nueva empresa",
                "item": "Licuadora",
                "origin": "Puebla",
                "destination": "Mérida",
                "transport": "Terrestre",
                "quantity": 1,
                "price": 0,
                "coords": [120, -90],
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Operation.objects.count(), operation_count)

    def test_create_client_is_stored_in_database(self):
        response = self.client.post(
            "/api/clients/",
            data={
                "name": "Cliente nuevo",
                "country": "México",
                "contact": "Luis Prueba",
                "email": "luis@example.com",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Client.objects.filter(name="Cliente nuevo", email="luis@example.com").exists())

    def test_inventory_item_can_be_created_with_optional_map_location(self):
        response = self.client.post(
            "/api/inventory/",
            data={
                "sku": "LIC-TEST",
                "name": "Licuadora de prueba",
                "category": InventoryItem.Category.HOME,
                "quantity": 3,
                "unit": InventoryItem.Unit.PIECE,
                "lowStockThreshold": 5,
                "location": "Bodega de prueba",
                "coords": [19.4326, -99.1332],
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        item = InventoryItem.objects.get(sku="LIC-TEST")
        self.assertEqual(item.quantity, 3)
        self.assertEqual(item.latitude, Decimal("19.4326"))
        self.assertEqual(response.json()["item"]["status"], "Bajo")

        stock_response = self.client.post(
            f"/api/inventory/{item.pk}/stock/",
            data={"quantity": 12},
            content_type="application/json",
        )
        self.assertEqual(stock_response.status_code, 200)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 12)
        self.assertEqual(stock_response.json()["item"]["status"], "Disponible")

    def test_inventory_item_can_be_created_without_location(self):
        response = self.client.post(
            "/api/inventory/",
            data={
                "sku": "SIN-UBICACION",
                "name": "Producto sin ubicación",
                "category": InventoryItem.Category.GENERAL,
                "quantity": 0,
                "unit": InventoryItem.Unit.PIECE,
                "lowStockThreshold": 5,
                "coords": None,
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertIsNone(response.json()["item"]["coords"])
        self.assertEqual(response.json()["item"]["status"], "Agotado")

    def test_invalid_inventory_coordinates_are_rejected(self):
        response = self.client.post(
            "/api/inventory/",
            data={
                "sku": "BAD-LOCATION",
                "name": "Producto con coordenadas inválidas",
                "coords": [100, 200],
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(InventoryItem.objects.filter(sku="BAD-LOCATION").exists())

    def test_alert_resolution_is_persisted(self):
        alert = Alert.objects.create(
            reference="AL-TEST",
            operation=self.operation,
            title="Alerta de prueba",
            severity=Alert.Severity.MEDIUM,
            area="Operaciones",
        )

        response = self.client.post(f"/api/alerts/{alert.reference}/toggle/")

        self.assertEqual(response.status_code, 200)
        alert.refresh_from_db()
        self.assertFalse(alert.is_open)

    def test_customs_review_can_be_created_and_updated(self):
        response = self.client.post(
            "/api/customs/",
            data={
                "operation": self.operation.reference,
                "type": "Importación de prueba",
                "office": "Aduana de prueba",
                "note": "Revisar expediente",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        review = CustomsReview.objects.get(reference=response.json()["customsReview"]["reference"])
        update = self.client.put(
            f"/api/customs/{review.reference}/",
            data={
                "operation": "",
                "type": "Exportación de prueba",
                "office": "Recinto actualizado",
                "status": CustomsReview.Status.RELEASED,
                "note": "Expediente liberado",
            },
            content_type="application/json",
        )

        self.assertEqual(update.status_code, 200)
        review.refresh_from_db()
        self.assertIsNone(review.operation)
        self.assertEqual(review.declaration_type, "Exportación de prueba")
        self.assertEqual(review.customs_office, "Recinto actualizado")
        self.assertEqual(review.status, CustomsReview.Status.RELEASED)
        self.assertEqual(review.note, "Expediente liberado")

    def test_risk_estimate_is_persisted_on_operation(self):
        response = self.client.post(
            "/api/risks/",
            data={"operation": self.operation.reference, "key": "weather", "value": 44},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.operation.refresh_from_db()
        self.assertEqual(self.operation.risk_weather, 44)
