from django.contrib import admin

from .models import Alert, Client, CustomsReview, InventoryItem, Operation, OperationDocument


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name", "country", "contact", "status", "created_at")
    search_fields = ("name", "country", "contact", "email")
    list_filter = ("status", "country")


class OperationDocumentInline(admin.TabularInline):
    model = OperationDocument
    extra = 0


@admin.register(Operation)
class OperationAdmin(admin.ModelAdmin):
    list_display = ("reference", "client", "transport", "status", "progress", "updated_at")
    search_fields = ("reference", "client__name", "item", "origin", "destination")
    list_filter = ("transport", "status")
    inlines = (OperationDocumentInline,)


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ("reference", "title", "operation", "severity", "area", "is_open", "updated_at")
    search_fields = ("reference", "title", "operation__reference")
    list_filter = ("severity", "area", "is_open")


@admin.register(CustomsReview)
class CustomsReviewAdmin(admin.ModelAdmin):
    list_display = ("reference", "operation", "declaration_type", "customs_office", "status", "updated_at")
    search_fields = ("reference", "operation__reference", "customs_office")
    list_filter = ("status", "customs_office")


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ("sku", "name", "category", "quantity", "unit", "location", "updated_at")
    search_fields = ("sku", "name", "location")
    list_filter = ("category", "unit")
