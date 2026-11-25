# Infinity Operations

Panel logístico de demostración construido con Django y SQLite. Operaciones,
clientes, alertas, revisiones aduaneras, checklist documental y estimaciones de
riesgo e inventario se guardan en la base de datos local `db.sqlite3`. El
inventario permite registrar SKU, categoría, existencias y mínimo de stock;
las coordenadas de ubicación son opcionales y solo se consultan al pulsar el
botón de ubicación del dispositivo.

## Mapas y documentación

Los mapas de seguimiento e inventario usan Leaflet con los mosaicos CARTO
Voyager. Requieren una API key de CARTO y conexión a internet; la atribución a
CARTO y OpenStreetMap se muestra en el mapa. Django entrega la clave al
navegador para solicitar los mosaicos. Restríngela por referente HTTP a
`http://127.0.0.1:8000/*` y `http://localhost:8000/*` durante el desarrollo.
Si una clave ya se compartió en público, revócala y genera una nueva.

Configura la clave en PowerShell antes de iniciar el servidor:

```powershell
$env:CARTO_BASEMAP_API_KEY = "TU_API_KEY_NUEVA"
python manage.py runserver
```

La ubicación del dispositivo solo se consulta después de pulsar el botón
correspondiente.

La sección **Documentos por transporte** explica los documentos principales
y complementarios habituales. El checklist de **Documentación** guarda el
avance por embarque y modalidad. Sus etiquetas Base y Condicional son una guía
de demostración, no una determinación legal: los requisitos dependen de la
mercancía, ruta, país y operación, y deben confirmarse con el agente o autoridad
correspondiente.

## Requisitos

- Python 3.12 o posterior
- Conexión a internet y una API key de CARTO para mostrar los mapas

## Iniciar en Windows

Desde PowerShell, en la carpeta del proyecto:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
$env:CARTO_BASEMAP_API_KEY = "TU_API_KEY_NUEVA"
python manage.py runserver
```

Abre `http://127.0.0.1:8000/`. Django crea la base SQLite y carga registros
iniciales de ejemplo durante la primera migración. Los cambios posteriores se
conservan al cerrar y volver a abrir el sitio.

La ubicación del dispositivo requiere permiso del navegador y funciona en
`localhost` o en un sitio servido mediante HTTPS. Las rutas del mapa son
orientativas, no son rastreo logístico en tiempo real.

## Acceso y datos

El acceso por nombre es solo una pantalla de demostración: no autentica ni
protege los datos. Mantén el servidor accesible únicamente en tu equipo. Antes
de publicar el sistema en una red o en internet, configura autenticación real,
una clave secreta segura, `DEBUG=False`, hosts permitidos y una base de datos y
servidor de producción.
