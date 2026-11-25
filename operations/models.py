from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Client(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "Activo", "Activo"
        REVIEW = "Revisión", "Revisión"

    name = models.CharField(max_length=180, unique=True)
    country = models.CharField(max_length=100)
    contact = models.CharField(max_length=160)
    email = models.EmailField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Operation(models.Model):
    class Transport(models.TextChoices):
        MARITIME = "Marítimo", "Marítimo"
        LAND = "Terrestre", "Terrestre"
        ROAD = "Carretero", "Carretero"
        AIR = "Aéreo", "Aéreo"
        RAIL = "Ferroviario", "Ferroviario"
        MULTIMODAL = "Multimodal", "Multimodal"

    class Status(models.TextChoices):
        PREPARATION = "Preparación", "Preparación"
        IN_TRANSIT = "En tránsito", "En tránsito"
        INCIDENT = "Incidencia", "Incidencia"
        ARRIVED = "En destino", "En destino"

    reference = models.CharField(max_length=24, unique=True)
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name="operations")
    item = models.CharField(max_length=200)
    origin = models.CharField(max_length=180)
    destination = models.CharField(max_length=220)
    transport = models.CharField(max_length=20, choices=Transport.choices)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.PREPARATION)
    progress = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    eta = models.CharField(max_length=80, default="Por estimar")
    recipient = models.CharField(max_length=160, blank=True)
    address = models.CharField(max_length=300, blank=True)
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    origin_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    origin_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    risk_delay = models.PositiveSmallIntegerField(default=7, validators=[MaxValueValidator(100)])
    risk_damage = models.PositiveSmallIntegerField(default=14, validators=[MaxValueValidator(100)])
    risk_customs = models.PositiveSmallIntegerField(default=13, validators=[MaxValueValidator(100)])
    risk_weather = models.PositiveSmallIntegerField(default=31, validators=[MaxValueValidator(100)])
    risk_loss = models.PositiveSmallIntegerField(default=38, validators=[MaxValueValidator(100)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.reference


class Alert(models.Model):
    class Severity(models.TextChoices):
        HIGH = "Alta", "Alta"
        MEDIUM = "Media", "Media"
        LOW = "Baja", "Baja"

    reference = models.CharField(max_length=24, unique=True)
    operation = models.ForeignKey(
        Operation,
        on_delete=models.SET_NULL,
        related_name="alerts",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=220)
    severity = models.CharField(max_length=12, choices=Severity.choices, default=Severity.MEDIUM)
    area = models.CharField(max_length=100)
    is_open = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.reference} · {self.title}"


class CustomsReview(models.Model):
    class Status(models.TextChoices):
        REVIEW = "En revisión", "En revisión"
        HELD = "Retenido", "Retenido"
        RELEASED = "Liberado", "Liberado"
        PENDING = "Pendiente", "Pendiente"

    reference = models.CharField(max_length=30, unique=True)
    operation = models.ForeignKey(
        Operation,
        on_delete=models.SET_NULL,
        related_name="customs_reviews",
        null=True,
        blank=True,
    )
    declaration_type = models.CharField(max_length=160)
    customs_office = models.CharField(max_length=120)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    note = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-id"]

    def __str__(self):
        return self.reference


class OperationDocument(models.Model):
    class Mode(models.TextChoices):
        MARITIME = "Marítimo", "Marítimo"
        LAND = "Terrestre", "Terrestre"
        ROAD = "Carretero", "Carretero"
        AIR = "Aéreo", "Aéreo"
        RAIL = "Ferroviario", "Ferroviario"
        MULTIMODAL = "Multimodal", "Multimodal"

    operation = models.ForeignKey(Operation, on_delete=models.CASCADE, related_name="documents")
    mode = models.CharField(max_length=20, choices=Mode.choices)
    document_index = models.PositiveSmallIntegerField()
    document_name = models.CharField(max_length=220)
    checked = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["mode", "document_index"]
        constraints = [
            models.UniqueConstraint(
                fields=["operation", "mode", "document_index"],
                name="unique_operation_document_index",
            )
        ]

    def __str__(self):
        return f"{self.operation.reference} · {self.document_name}"


class InventoryItem(models.Model):
    class Category(models.TextChoices):
        ELECTRONICS = "Electrónica", "Electrónica"
        HOME = "Hogar", "Hogar"
        FOOD = "Alimentos", "Alimentos"
        CLOTHING = "Ropa", "Ropa"
        PARTS = "Refacciones", "Refacciones"
        GENERAL = "General", "General"

    class Unit(models.TextChoices):
        PIECE = "pieza", "Pieza(s)"
        BOX = "caja", "Caja(s)"
        PACKAGE = "paquete", "Paquete(s)"
        KILOGRAM = "kg", "Kilogramos"
        LITER = "litro", "Litros"

    sku = models.CharField(max_length=60, unique=True)
    name = models.CharField(max_length=180)
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.GENERAL)
    quantity = models.PositiveIntegerField(default=0)
    unit = models.CharField(max_length=20, choices=Unit.choices, default=Unit.PIECE)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    location = models.CharField(max_length=220, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "name", "sku"]

    def __str__(self):
        return f"{self.sku} · {self.name}"
