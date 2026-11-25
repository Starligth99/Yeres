from django.urls import path

from . import views


urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("api/inventory/", views.inventory_api, name="inventory-api"),
    path("api/inventory/<int:item_id>/stock/", views.inventory_stock_api, name="inventory-stock-api"),
    path("api/operations/", views.operations_api, name="operations-api"),
    path("api/operations/<str:reference>/advance/", views.advance_operation_api, name="advance-operation-api"),
    path("api/clients/", views.clients_api, name="clients-api"),
    path("api/alerts/resolve-all/", views.resolve_all_alerts_api, name="resolve-all-alerts-api"),
    path("api/alerts/<str:reference>/toggle/", views.toggle_alert_api, name="toggle-alert-api"),
    path("api/customs/", views.customs_api, name="customs-api"),
    path("api/customs/<str:reference>/", views.customs_detail_api, name="customs-detail-api"),
    path("api/documents/", views.documents_api, name="documents-api"),
    path("api/risks/", views.risks_api, name="risks-api"),
]
