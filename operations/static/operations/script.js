const initialData = JSON.parse(document.getElementById("infinity-data").textContent);
const operations = initialData.operations;
const clients = initialData.clients;
const alerts = initialData.alerts;
const customsReviews = initialData.customs;
const inventoryItems = initialData.inventory || [];
const cartoBasemapApiKey = JSON.parse(document.getElementById("carto-basemap-api-key").textContent);

const transportDocuments = {
  Marítimo: [
    ["Conocimiento de embarque (Bill of Lading o B/L)", "Base"],
    ["Factura comercial internacional", "Base"],
    ["Lista de empaque (Packing List)", "Base"],
    ["Instrucciones de embarque", "Base"],
    ["VGM / masa bruta verificada (cuando aplique)", "Condicional"],
    ["Certificado de origen (si aplica)", "Condicional"],
    ["Póliza o certificado de seguro", "Condicional"],
    ["Declaración de mercancías peligrosas / IMDG", "Condicional"],
    ["Documentos aduaneros y permisos aplicables", "Base"]
  ],
  Aéreo: [
    ["Carta de porte aéreo (Air Waybill o AWB)", "Base"],
    ["Factura comercial internacional", "Base"],
    ["Lista de empaque (Packing List)", "Base"],
    ["Declaración de seguridad de carga", "Condicional"],
    ["Certificado de origen (si aplica)", "Condicional"],
    ["Certificados sanitarios o fitosanitarios", "Condicional"],
    ["Declaración de mercancías peligrosas / IATA", "Condicional"],
    ["Documentos aduaneros y permisos aplicables", "Base"]
  ],
  Terrestre: [
    ["Carta de porte / CMR", "Base"],
    ["Factura comercial internacional", "Base"],
    ["Lista de empaque (Packing List)", "Base"],
    ["Complemento Carta Porte del CFDI (México)", "Base"],
    ["Pedimento o declaración aduanera", "Condicional"],
    ["Certificado de origen", "Condicional"],
    ["Póliza o certificado de seguro", "Condicional"],
    ["Permisos sectoriales y de circulación", "Condicional"]
  ],
  Ferroviario: [
    ["Carta de porte ferroviario CIM", "Base"],
    ["Factura comercial internacional", "Base"],
    ["Lista de empaque (Packing List)", "Base"],
    ["Talón de embarque ferroviario", "Condicional"],
    ["Documentos aduaneros y permisos", "Base"],
    ["Certificado de origen", "Condicional"],
    ["Póliza o certificado de seguro", "Condicional"]
  ],
  Multimodal: [
    ["Conocimiento multimodal FBL / documento FIATA", "Base"],
    ["Factura comercial internacional", "Base"],
    ["Lista de empaque (Packing List)", "Base"],
    ["Documentos de cada tramo de transporte", "Base"],
    ["Declaración o manifiesto aduanero", "Base"],
    ["Certificados de origen, sanitarios o de inspección", "Condicional"],
    ["Póliza de seguro multimodal", "Condicional"]
  ],
  Carretero: [
    ["Carta porte", "Base"],
    ["Complemento Carta Porte del CFDI (México)", "Base"],
    ["Factura comercial internacional", "Base"],
    ["Lista de empaque (Packing List)", "Base"],
    ["CMR para rutas internacionales aplicables", "Condicional"],
    ["Permisos de circulación o sectoriales", "Condicional"],
    ["Pedimento o declaración aduanera", "Condicional"]
  ]
};

function describeDocument(name) {
  if (/Bill of Lading|\bB\/L\b/i.test(name)) return "Contrato y recibo de carga marítima; puede funcionar como título negociable según cómo se emita.";
  if (/Air Waybill|\bAWB\b/i.test(name)) return "Acredita el contrato y recepción de la carga aérea; no es negociable ni título de propiedad.";
  if (/\bCMR\b/i.test(name)) return "Registra el contrato internacional por carretera, la ruta, la carga y las responsabilidades.";
  if (/FBL|FIATA|multimodal/i.test(name)) return "Ampara varios medios bajo un contrato multimodal; puede ser negociable si se emite a la orden.";
  if (/Talón de embarque/i.test(name)) return "Constancia ferroviaria de recepción o embarque; valida si se exige junto con la carta CIM.";
  if (/ferroviario|\bCIM\b/i.test(name)) return "Documenta las condiciones y la recepción de la mercancía para su traslado por tren.";
  if (/Factura comercial/i.test(name)) return "Detalla comprador, vendedor, mercancía, precio, moneda y condiciones de venta, como el Incoterm.";
  if (/Packing List|lista de empaque/i.test(name)) return "Desglosa bultos, contenido, pesos y dimensiones; normalmente no incluye precios.";
  if (/Complemento Carta Porte/i.test(name)) return "Complemento del CFDI aplicable al traslado de mercancías en México; verifica el supuesto vigente.";
  if (/carta de porte|carta porte/i.test(name)) return "Identifica la carga y las condiciones del traslado terrestre; confirma el formato requerido para la ruta.";
  if (/seguro|póliza/i.test(name)) return "Resume cobertura, vigencia, riesgos amparados, exclusiones y procedimiento ante daños o pérdidas.";
  if (/aduan|pedimento|manifiesto/i.test(name)) return "Apoya el control y despacho aduanero; el formato depende del país y de si es importación o exportación.";
  if (/sanitari|fitosanitari|inspección/i.test(name)) return "Acredita controles sanitarios, fitosanitarios o de inspección cuando los exige el producto o destino.";
  if (/origen/i.test(name)) return "Acredita el país de origen y puede ser necesario para preferencias arancelarias o requisitos del destino.";
  if (/peligrosas|IMDG|IATA/i.test(name)) return "Describe clasificación, riesgos y manejo seguro de mercancías peligrosas conforme al modo aplicable.";
  if (/VGM|masa bruta/i.test(name)) return "Declara la masa bruta verificada del contenedor cuando las reglas marítimas aplicables lo requieren.";
  if (/instrucciones de embarque/i.test(name)) return "Comunica al transportista los datos de carga, consignatario y emisión del documento de transporte.";
  if (/seguridad de carga/i.test(name)) return "Registra controles y datos de seguridad solicitados para aceptar o transportar la carga aérea.";
  if (/cada tramo|tramo de transporte/i.test(name)) return "Reúne la evidencia y referencias de cada etapa incluida en la operación multimodal.";
  if (/permisos|circulación/i.test(name)) return "Confirma autorizaciones sectoriales, del vehículo o de circulación exigidas para la mercancía y ruta.";
  return "Confirma formato, vigencia y alcance con el agente de carga y las autoridades de origen y destino.";
}

function showMapLoadError(elementId, title, message) {
  const errorPanel = document.getElementById(elementId);
  if (!errorPanel) return;
  errorPanel.querySelector("strong").textContent = title;
  errorPanel.querySelector("span").textContent = message;
  errorPanel.hidden = false;
}

function showMissingCartoApiKey(elementId) {
  showMapLoadError(
    elementId,
    "CARTO requiere una API key",
    "Configura CARTO_BASEMAP_API_KEY en PowerShell y reinicia el servidor."
  );
}

let activeMapInfoWindow = null;

function closeMapInfoWindow() {
  if (activeMapInfoWindow) activeMapInfoWindow.remove();
  activeMapInfoWindow = null;
}

function openMapInfoWindow(map, marker, content) {
  closeMapInfoWindow();
  activeMapInfoWindow = window.L.popup({ maxWidth: 280, autoPanPadding: [18, 18] })
    .setLatLng(marker.getLatLng())
    .setContent(content)
    .openOn(map);
}

function createMapMarker(map, coords, className, title) {
  const content = document.createElement("span");
  content.className = className;
  content.setAttribute("aria-hidden", "true");
  content.innerHTML = "<i></i>";
  const icon = window.L.divIcon({
    className: "leaflet-custom-marker",
    html: content,
    iconSize: [32, 32],
    iconAnchor: [16, 28]
  });
  return window.L.marker(coords, { icon, title }).addTo(map);
}

function setMapMarkerVisible(map, marker, visible) {
  if (!map || !marker) return;
  const isVisible = map.hasLayer(marker);
  if (visible && !isVisible) marker.addTo(map);
  else if (!visible && isVisible) map.removeLayer(marker);
}

function createCartoMap(mapElement, errorElementId) {
  if (!window.L) throw new Error("Leaflet no se cargó.");
  const map = window.L.map(mapElement, { scrollWheelZoom: false }).setView([23.6, -102.5], 5);
  const tiles = window.L.tileLayer(
    "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=" + encodeURIComponent(cartoBasemapApiKey),
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attribution/">CARTO</a>',
      maxZoom: 20
    }
  );
  let tileErrorReported = false;
  tiles.on("tileerror", (event) => {
    if (tileErrorReported) return;
    tileErrorReported = true;
    console.error("No se pudo cargar un mosaico de CARTO Voyager.", event.error || event);
    showMapLoadError(
      errorElementId,
      "No se pudieron cargar mosaicos de CARTO",
      "Verifica la clave, su restricción de dominio y tu conexión a internet."
    );
  });
  tiles.addTo(map);
  return map;
}

const state = {
  view: "dashboard",
  operationQuery: "",
  documentMode: operations.length ? operations[0].transport : "Marítimo",
  documentOperation: operations.length ? operations[0].id : "",
  checkedDocuments: initialData.checkedDocuments || {},
  risk: { delay: 7, damage: 14, customs: 13, weather: 31, loss: 38 },
  riskOperation: operations.length ? operations[0].id : "",
  riskSaveTimers: {},
  reportMonths: 12,
  inventoryQuery: "",
  inventoryCategory: "Todas",
  deviceLocation: null,
  newOperationLocation: null,
  activeOperationTimer: null,
  mapFilter: "all"
};

let operationsMap = null;
let operationMapMarkers = [];
let selectedRouteLayer = null;
let routeOriginMarker = null;
let deviceLocationMarker = null;
let inventoryMap = null;
let inventoryMapMarkers = [];

function disposeOperationsMap() {
  closeMapInfoWindow();
  if (operationsMap) operationsMap.remove();
  operationsMap = null;
  operationMapMarkers = [];
  selectedRouteLayer = null;
  routeOriginMarker = null;
  deviceLocationMarker = null;
}

function disposeInventoryMap() {
  closeMapInfoWindow();
  if (inventoryMap) inventoryMap.remove();
  inventoryMap = null;
  inventoryMapMarkers = [];
}

const viewTitles = {
  dashboard: ["Resumen ejecutivo", "Panel principal"],
  map: ["Seguimiento geográfico", "Mapa operativo"],
  shipments: ["Control de embarques", "Embarques"],
  transport: ["Unidades y asignaciones", "Transporte"],
  documents: ["Expediente documental", "Documentación"],
  "transport-documents": ["Requisitos por modalidad", "Documentos por transporte"],
  risk: ["Escenarios y prevención", "Panel de probabilidades"],
  customs: ["Despacho y cumplimiento", "Control aduanero"],
  clients: ["Cuentas y contactos", "Clientes"],
  alerts: ["Seguimiento y resolución", "Alertas e incidencias"],
  reports: ["Indicadores de operación", "Reportes"],
  inventory: ["Existencias y ubicaciones", "Inventario"]
};

const appShell = document.getElementById("appShell");
const loginScreen = document.getElementById("loginScreen");
const pageContent = document.getElementById("pageContent");
const modalBackdrop = document.getElementById("modalBackdrop");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function statusClass(status) {
  if (status === "En destino" || status === "Entregado" || status === "Liberado" || status === "Activo" || status === "Disponible") return "status-green";
  if (status === "Incidencia" || status === "Retenido" || status === "Alta" || status === "Bajo" || status === "Agotado") return "status-amber";
  if (status === "Preparación" || status === "Pendiente" || status === "Revisión" || status === "Media") return "status-purple";
  return "status-blue";
}

function statusPill(status) {
  return '<span class="status-pill ' + statusClass(status) + '">' + escapeHTML(status) + "</span>";
}

function toast(message, kind = "success") {
  const toastNode = document.createElement("div");
  toastNode.className = "toast toast-" + kind;
  toastNode.textContent = message;
  document.getElementById("toastRegion").appendChild(toastNode);
  window.setTimeout(() => toastNode.remove(), 3600);
}

async function apiRequest(url, method = "GET", data = null) {
  const headers = { Accept: "application/json" };
  const options = { method, headers, credentials: "same-origin" };
  if (data !== null) {
    headers["Content-Type"] = "application/json";
    headers["X-CSRFToken"] = document.querySelector('#loginForm [name="csrfmiddlewaretoken"]').value;
    options.body = JSON.stringify(data);
  }
  const response = await fetch(url, options);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "No se pudo completar la solicitud.");
  return result;
}

function updateOperationCache(operation) {
  const index = operations.findIndex((item) => item.id === operation.id);
  if (index === -1) operations.unshift(operation);
  else operations[index] = operation;
}

function updateClientCache(client) {
  const index = clients.findIndex((item) => item.name.toLowerCase() === client.name.toLowerCase());
  if (index === -1) clients.unshift(client);
  else clients[index] = client;
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll(".theme-toggle").forEach((button) => {
    const dark = theme === "dark";
    button.setAttribute("aria-pressed", String(dark));
    button.querySelector(".theme-icon").textContent = dark ? "☀" : "☾";
    button.querySelector(".theme-label").textContent = dark ? "Claro" : "Oscuro";
  });
  document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#081321" : "#edf3f9";
  try {
    localStorage.setItem("infinity-ops-theme", theme);
  } catch (error) {
    console.warn("No se pudo guardar la preferencia del tema.", error);
  }
}

try {
  setTheme(localStorage.getItem("infinity-ops-theme") || "dark");
} catch (error) {
  setTheme("dark");
}

document.querySelectorAll(".theme-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
});

document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const enteredName = document.getElementById("username").value.trim() || "Demo";
  document.getElementById("profileName").textContent = enteredName;
  document.getElementById("profileInitial").textContent = enteredName.charAt(0).toUpperCase();
  loginScreen.hidden = true;
  appShell.hidden = false;
  renderView("dashboard");
});

document.getElementById("profileButton").addEventListener("click", () => {
  if (state.activeOperationTimer) {
    window.clearInterval(state.activeOperationTimer);
    state.activeOperationTimer = null;
  }
  appShell.hidden = true;
  loginScreen.hidden = false;
  document.getElementById("loginForm").reset();
});

document.getElementById("mobileMenu").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("sidebar-open");
});

function navigate(view) {
  if (!viewTitles[view]) return;
  state.view = view;
  document.getElementById("sidebar").classList.remove("sidebar-open");
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  renderView(view);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-view]");
  if (!nav) return;
  event.preventDefault();
  navigate(nav.dataset.view);
});

document.getElementById("globalSearch").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    state.operationQuery = event.currentTarget.value.trim();
    navigate("shipments");
  }
});

function pageHeading(view, actions = "") {
  const title = viewTitles[view];
  return '<div class="page-heading"><div><p class="eyebrow">' + escapeHTML(title[0]) + '</p><h1>' +
    escapeHTML(title[1]) + '</h1><p class="page-subtitle">Supervisa embarques, transporte y cumplimiento desde un solo lugar.</p></div>' +
    '<div class="heading-actions">' + actions + "</div></div>";
}

function renderView(view) {
  state.view = view;
  const title = viewTitles[view];
  document.getElementById("topbarTitle").textContent = title[1];
  const views = {
    dashboard: renderDashboard,
    map: renderMapView,
    shipments: renderShipments,
    transport: renderTransport,
    documents: renderDocuments,
    "transport-documents": renderTransportDocuments,
    risk: renderRisk,
    customs: renderCustoms,
    clients: renderClients,
    alerts: renderAlerts,
    reports: renderReports,
    inventory: renderInventory
  };
  pageContent.innerHTML = views[view]();
  if (!pageContent.querySelector("#operationsMap") && operationsMap) {
    disposeOperationsMap();
  } else if (pageContent.querySelector("#operationsMap") && !appShell.hidden) {
    initializeOperationsMap();
  }
  if (!pageContent.querySelector("#inventoryMap") && inventoryMap) {
    disposeInventoryMap();
  } else if (pageContent.querySelector("#inventoryMap") && !appShell.hidden) {
    initializeInventoryMap();
  }
  pageContent.focus({ preventScroll: true });
  document.getElementById("alertNavCount").textContent = alerts.filter((alert) => alert.open).length;
  document.getElementById("shipmentNavCount").textContent = operations.length;
  document.getElementById("inventoryNavCount").textContent = inventoryItems.length;
}

function renderMap(overview = false) {
  const unlocatedCount = operations.filter((operation) => !Array.isArray(operation.coords)).length;
  return '<div class="map-stage' + (overview ? " map-stage-overview" : "") + '"><div id="operationsMap" class="leaflet-map" data-map-mode="' +
    (overview ? "overview" : "tracking") + '" role="application" aria-label="Mapa interactivo de embarques"></div>' +
    '<div class="map-load-error" id="mapLoadError" role="status" hidden><strong>No se pudo cargar el mapa de CARTO</strong><span>Comprueba tu conexión a internet.</span></div>' +
    '<div class="map-location" id="deviceMapLocation" hidden><span>⌖</span>Tu dispositivo</div>' +
    '<div class="map-legend"><span><i class="legend-blue"></i>En tránsito</span><span><i class="legend-green"></i>En destino</span><span><i class="legend-amber"></i>Incidencia</span><span><i class="legend-origin"></i>Origen de ruta</span>' +
    (unlocatedCount ? '<span class="map-unlocated">' + unlocatedCount + ' sin ubicación</span>' : "") + '</div></div>';
}

function initializeOperationsMap() {
  const mapElement = document.getElementById("operationsMap");
  if (!mapElement) return;
  disposeOperationsMap();
  if (!cartoBasemapApiKey) {
    showMissingCartoApiKey("mapLoadError");
    return;
  }
  try {
    operationsMap = createCartoMap(mapElement, "mapLoadError");
  } catch (error) {
    console.error("No se pudo inicializar el mapa de seguimiento.", error);
    showMapLoadError("mapLoadError", "No se pudo inicializar el mapa", "Comprueba que Leaflet se haya cargado y que tengas conexión a internet.");
    return;
  }
  operations.filter((operation) => Array.isArray(operation.coords)).forEach((operation) => {
    const tone = operation.status === "Incidencia" ? "warning" : operation.status === "En destino" ? "success" : "active";
    const marker = createMapMarker(operationsMap, operation.coords, "map-pin map-pin-" + tone, operation.id + " · " + operation.destination);
    marker.on("click", () => {
      const routeSelect = document.getElementById("routeSelect");
      if (routeSelect) {
        routeSelect.value = operation.id;
        document.getElementById("routeOverview").innerHTML = renderRouteOverview(operation);
        focusMapOperation(operation.id);
      }
    });
    operationMapMarkers.push({ operation, marker });
    if (state.mapFilter !== "all" && operation.status !== state.mapFilter) {
      setMapMarkerVisible(operationsMap, marker, false);
    }
  });

  if (state.deviceLocation) showDeviceLocationOnMap();
  if (mapElement.dataset.mapMode === "tracking" && operations.length) {
    const selected = document.getElementById("routeSelect");
    focusMapOperation(selected ? selected.value : operations[0].id);
  } else if (operationMapMarkers.length) {
    fitMapToOperations();
  }
}

function fitMapToOperations() {
  if (!operationsMap) return;
  const visibleMarkers = operationMapMarkers.filter((entry) =>
    (state.mapFilter === "all" || entry.operation.status === state.mapFilter) && Array.isArray(entry.operation.coords)
  );
  if (!visibleMarkers.length) {
    toast("No hay embarques ubicables con este filtro.", "error");
    return;
  }
  closeMapInfoWindow();
  if (selectedRouteLayer) operationsMap.removeLayer(selectedRouteLayer);
  if (routeOriginMarker) operationsMap.removeLayer(routeOriginMarker);
  selectedRouteLayer = null;
  routeOriginMarker = null;
  const bounds = window.L.latLngBounds(visibleMarkers.map((entry) => entry.marker.getLatLng()));
  if (visibleMarkers.length === 1) {
    operationsMap.setView(bounds.getCenter(), 8, { animate: false });
  } else {
    operationsMap.fitBounds(bounds, { padding: [56, 56], animate: false });
  }
}

function focusMapOperation(id) {
  if (!operationsMap) return;
  const entry = operationMapMarkers.find((item) => item.operation.id === id);
  if (!entry || !Array.isArray(entry.operation.coords)) {
    closeMapInfoWindow();
    if (selectedRouteLayer) operationsMap.removeLayer(selectedRouteLayer);
    if (routeOriginMarker) operationsMap.removeLayer(routeOriginMarker);
    selectedRouteLayer = null;
    routeOriginMarker = null;
    fitMapToOperations();
    toast("Este registro no tiene coordenadas para mostrar en el mapa.", "error");
    return;
  }
  closeMapInfoWindow();
  if (selectedRouteLayer) operationsMap.removeLayer(selectedRouteLayer);
  if (routeOriginMarker) operationsMap.removeLayer(routeOriginMarker);
  selectedRouteLayer = null;
  routeOriginMarker = null;

  const origin = entry.operation.originCoords;
  if (Array.isArray(origin)) {
    selectedRouteLayer = window.L.polyline([origin, entry.operation.coords], {
      color: "#1687e8",
      opacity: 0.75,
      weight: 3,
      dashArray: "8 8"
    }).addTo(operationsMap);
    routeOriginMarker = createMapMarker(operationsMap, origin, "map-pin map-pin-origin", "Origen · " + entry.operation.origin);
    routeOriginMarker.on("click", () => openMapInfoWindow(
      operationsMap,
      routeOriginMarker,
      '<div class="map-popup"><span>ORIGEN · ' + escapeHTML(entry.operation.id) + '</span><strong>' +
        escapeHTML(entry.operation.origin) + '</strong><small>Trazo orientativo; no es una ruta de navegación.</small></div>'
    ));
    operationsMap.fitBounds(window.L.latLngBounds([origin, entry.operation.coords]), { padding: [64, 64], animate: false });
  } else {
    operationsMap.setView(entry.operation.coords, 9, { animate: false });
  }
  openMapInfoWindow(
    operationsMap,
    entry.marker,
    '<div class="map-popup"><span>EMBARQUE · ' + escapeHTML(entry.operation.id) + '</span><strong>' + escapeHTML(entry.operation.destination) +
      '</strong><small>' + escapeHTML(entry.operation.transport) + ' · ' + escapeHTML(entry.operation.status) +
      '</small><button type="button" data-action="details" data-id="' + escapeHTML(entry.operation.id) + '">Ver operación →</button></div>'
  );
}

function showDeviceLocationOnMap() {
  if (!operationsMap || !state.deviceLocation) return;
  const position = [state.deviceLocation.latitude, state.deviceLocation.longitude];
  if (deviceLocationMarker) operationsMap.removeLayer(deviceLocationMarker);
  deviceLocationMarker = createMapMarker(operationsMap, position, "map-pin map-pin-device", "Ubicación de este dispositivo");
  operationsMap.setView(position, 13, { animate: false });
  openMapInfoWindow(operationsMap, deviceLocationMarker, "Ubicación de este dispositivo");
  const badge = document.getElementById("deviceMapLocation");
  if (badge) {
    badge.hidden = false;
    badge.textContent = "⌖ Ubicación de este dispositivo";
  }
}

function operationRows(list) {
  if (!list.length) return '<tr><td class="empty-cell" colspan="8">No encontramos operaciones con esos filtros.</td></tr>';
  return list.map((operation) =>
    "<tr><td><button class=\"text-action\" data-action=\"details\" data-id=\"" + escapeHTML(operation.id) + "\">" + escapeHTML(operation.id) +
    "</button></td><td>" + escapeHTML(operation.client) + "</td><td>" + escapeHTML(operation.origin) + "</td><td>" +
    escapeHTML(operation.destination) + '</td><td><span class="transport-type">' + escapeHTML(operation.transport) +
    "</span></td><td>" + statusPill(operation.status) + '</td><td><div class="table-progress"><span style="width:' +
    Number(operation.progress) + '%"></span></div><small>' + Number(operation.progress) + '%</small></td><td><button class="table-action" data-action="details" data-id="' +
    escapeHTML(operation.id) + '">Ver</button></td></tr>'
  ).join("");
}

function operationTable(list, includeActions = true) {
  return '<div class="table-scroll"><table class="data-table"><thead><tr><th>Referencia</th><th>Cliente</th><th>Origen</th><th>Destino</th><th>Transporte</th><th>Estado</th><th>Avance</th>' +
    (includeActions ? "<th>Acción</th>" : "") + "</tr></thead><tbody>" + operationRows(list) + "</tbody></table></div>";
}

function renderDashboard() {
  state.mapFilter = "all";
  const recent = [...operations].slice(0, 5);
  const activeOperations = operations.filter((operation) => operation.status !== "En destino").length;
  const completedOperations = operations.filter((operation) => operation.status === "En destino").length;
  const openAlerts = alerts.filter((alert) => alert.open).length;
  const activityItems = operations.slice(0, 3).map((operation) => [
    operation.status === "Incidencia" ? "!" : operation.status === "En destino" ? "✓" : "↗",
    operation.status + " · " + operation.id,
    operation.updated + " · " + operation.transport,
    operation.status === "Incidencia" ? "amber" : operation.status === "En destino" ? "green" : "blue"
  ]);
  return pageHeading("dashboard", '<button class="button button-primary" data-action="new-operation">＋ Nueva operación</button>') +
    '<section class="dashboard-hero"><div class="hero-copy"><span class="hero-kicker"><i></i> OPERACIONES · VISTA EN VIVO</span><h2>La logística<br>en <em>movimiento.</em></h2>' +
    '<p>Una lectura rápida de tus rutas, entregas y alertas. Todo en un solo pulso.</p><div class="hero-actions"><button class="button button-hero" data-view="map">Explorar mapa <span>↗</span></button><span class="hero-date">DATOS DE DEMOSTRACIÓN</span></div></div>' +
    '<article class="hero-trend"><div class="hero-trend-heading"><div><span>ACTIVIDAD RECIENTE</span><strong>Ritmo de embarques</strong></div><span class="trend-period">12 MESES</span></div>' +
    renderDashboardTrend() + '<div class="hero-trend-foot"><span><i></i> Registros mensuales</span><strong>' + operations.length + ' <small>en la base</small></strong></div></article>' +
    '<div class="hero-orbit hero-orbit-one"></div><div class="hero-orbit hero-orbit-two"></div></section>' +
    '<section class="metric-grid dashboard-metrics" aria-label="Indicadores principales">' +
    metricCard("Embarques registrados", String(operations.length), "Registros guardados en SQLite", "▣", "blue", "Base de datos local") +
    metricCard("Operaciones en proceso", String(activeOperations), "Aún no han llegado a destino", "↗", "cyan", "Seguimiento local") +
    metricCard("Entregas en destino", String(completedOperations), "Operaciones completadas", "✓", "green", "Base de datos local") +
    metricCard("Alertas por revisar", String(openAlerts), "Incidencias abiertas", "!", "amber", "Atención operativa") +
    '</section><section class="dashboard-analytics"><article class="panel analytics-volume"><div class="panel-heading"><div><span class="panel-kicker">TENDENCIA</span><h2>Volumen de embarques</h2><p>Registros guardados por mes</p></div><button class="link-button" data-view="reports">Ver reportes <span>↗</span></button></div>' +
    renderDashboardBars() + '</article><article class="panel analytics-modes"><div class="panel-heading"><div><span class="panel-kicker">COMPOSICIÓN</span><h2>Mezcla de transporte</h2><p>Según los registros guardados</p></div></div>' +
    renderDashboardDonut() + '</article></section><section class="dashboard-grid"><article class="panel map-panel"><div class="panel-heading"><div><span class="panel-kicker">GEOLOCALIZACIÓN</span><h2>Mapa de operaciones</h2><p>Ubicaciones y rutas orientativas guardadas</p></div><button class="link-button" data-view="map">Abrir mapa completo <span>↗</span></button></div>' +
    renderMap(true) + '</article><article class="panel status-panel"><div class="panel-heading"><div><h2>Estado de operaciones</h2><p>Distribución por etapa</p></div></div>' +
    statusDistribution() + '<div class="activity-heading"><h3>Actividad reciente</h3><button class="link-button" data-view="alerts">Ver todas</button></div><div class="activity-list">' +
    activityItems.map((item) => '<div class="activity-item"><span class="activity-icon activity-' + item[3] + '">' + item[0] +
      '</span><div><strong>' + item[1] + "</strong><small>" + item[2] + "</small></div></div>").join("") +
    '</div></article></section><section class="panel recent-panel"><div class="panel-heading"><div><h2>Operaciones recientes</h2><p>Últimos embarques guardados en la base de datos</p></div><button class="button button-secondary" data-view="shipments">Ver embarques <span>→</span></button></div>' +
    operationTable(recent) + "</section>";
}

function renderDashboardTrend() {
  const months = monthlyOperationCounts().slice(-8);
  const maximum = Math.max(1, ...months.map((month) => month.count));
  const coordinates = months.map((month, index) => ({
    x: 24 + index * 75,
    y: 145 - Math.round(month.count / maximum * 108)
  }));
  const labels = months.map((month) => month.label);
  const line = coordinates.map((point, index) => (index ? "L " : "M ") + point.x + " " + point.y).join(" ");
  const area = line + " L 549 153 L 24 153 Z";
  return '<div class="hero-chart"><svg viewBox="0 0 575 170" role="img" aria-label="Actividad de embarques registrada durante los últimos ocho meses">' +
    '<defs><linearGradient id="heroChartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#65d6ff" stop-opacity=".28"/><stop offset="100%" stop-color="#2585ed" stop-opacity="0"/></linearGradient></defs>' +
    '<path class="hero-chart-grid" d="M24 35H550 M24 74H550 M24 113H550 M24 153H550"/><path class="hero-chart-area" d="' + area + '"/><path class="hero-chart-line" d="' + line + '">' +
    '</path>' + coordinates.map((point, index) => '<circle class="hero-chart-point' + (index === coordinates.length - 1 ? " hero-chart-point-current" : "") +
      '" cx="' + point.x + '" cy="' + point.y + '" r="' + (index === coordinates.length - 1 ? 5 : 3) + '"/>').join("") +
    '</svg><div class="hero-chart-labels">' + labels.map((label) => "<span>" + label + "</span>").join("") + "</div></div>";
}

function renderDashboardBars() {
  const data = monthlyOperationCounts();
  const maximum = Math.max(1, ...data.map((month) => month.count));
  return   '<div class="dashboard-bar-chart" role="img" aria-label="Embarques registrados por mes en la base de datos">' + data.map((item, index) =>
    '<div class="dashboard-bar-column"><span class="dashboard-bar-value">' + item.count + '</span><i class="dashboard-bar dashboard-bar-' + (index === data.length - 1 ? "highlight" : "default") +
    '" style="--bar-height:' + (item.count ? Math.max(8, item.count / maximum * 100) : 3) + '%"></i><small>' + item.label + '</small></div>'
  ).join("") + '</div><div class="dashboard-chart-note"><span><i></i> Embarques registrados</span><small>Base de datos · últimas 12 mensualidades</small></div>';
}

function monthlyOperationCounts() {
  const currentMonth = new Date();
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 11 + index, 1);
    const count = operations.filter((operation) => {
      const created = new Date(operation.createdAt);
      return created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth();
    }).length;
    return {
      label: date.toLocaleString("es-MX", { month: "short" }).replace(".", "").toUpperCase(),
      count
    };
  });
}

function renderDashboardDonut() {
  const modes = [
    ["Marítimo", "#4ea8ff"],
    ["Terrestre", "#31d2d0"],
    ["Aéreo", "#a38aff"],
    ["Ferroviario", "#f0b857"],
    ["Otros", "#61d6a5"]
  ];
  const counts = modes.map((item) => operations.filter((operation) =>
    item[0] === "Otros" ? !["Marítimo", "Terrestre", "Aéreo", "Ferroviario"].includes(operation.transport) : operation.transport === item[0]
  ).length);
  const total = operations.length;
  const circumference = 276.46;
  let offset = 0;
  const arcs = modes.map((item, index) => {
    const length = total ? counts[index] / total * circumference : 0;
    const arc = '<circle cx="60" cy="60" r="44" fill="none" stroke="' + item[1] + '" stroke-width="12" stroke-dasharray="' +
      length + " " + (circumference - length) + '" stroke-dashoffset="' + -offset + '"/>';
    offset += length;
    return arc;
  }).join("");
  return '<div class="donut-layout"><div class="donut-visual"><svg viewBox="0 0 120 120" role="img" aria-label="Distribución de ' + total + ' embarques por transporte">' +
    '<circle cx="60" cy="60" r="44" fill="none" stroke="var(--border)" stroke-width="12"/><g transform="rotate(-90 60 60)">' + arcs +
    '</g></svg><div class="donut-center"><strong>' + total + '</strong><span>REGISTROS</span></div></div><div class="donut-legend">' +
    modes.map((item, index) => '<div><span><i style="--legend-color:' + item[1] + '"></i>' + item[0] + '</span><strong>' +
      (total ? Math.round(counts[index] / total * 100) : 0) + '%</strong></div>').join("") + '</div></div><p class="donut-note">Distribución calculada con los embarques guardados.</p>';
}

function metricCard(title, value, note, icon, tone, footnote) {
  return '<article class="metric-card"><div class="metric-top"><span>' + title + '</span><span class="metric-icon metric-' + tone + '">' + icon +
    '</span></div><strong class="metric-value">' + value + '</strong><div class="metric-bottom"><span class="metric-note metric-note-' + tone + '">' + note +
    '</span><small>' + footnote + "</small></div></article>";
}

function statusDistribution() {
  const total = operations.length;
  const data = [
    ["En tránsito", "blue"],
    ["Preparación", "cyan"],
    ["En destino", "green"],
    ["Incidencia", "amber"]
  ].map((item) => {
    const count = operations.filter((operation) => operation.status === item[0]).length;
    return [item[0], count, total ? Math.round(count / total * 100) : 0, item[1]];
  });
  return '<div class="status-bars">' + data.map((item) =>
    '<div class="status-bar-row"><div class="bar-label"><strong>' + item[0] + '</strong><span>' + item[1] + " · " + item[2] +
    '%</span></div><div class="bar-track"><span class="bar-' + item[3] + '" style="width:' + item[2] + '%"></span></div></div>'
  ).join("") + "</div>";
}

function renderMapView() {
  state.mapFilter = "all";
  const active = operations.filter((operation) => operation.status !== "En destino");
  return pageHeading("map", '<button class="button button-secondary" data-action="geolocate">⌖ Usar mi ubicación</button>') +
    '<div class="filter-pills" role="group" aria-label="Filtros de mapa"><button class="filter-pill active" data-action="map-filter" data-map-filter="all">Todas las operaciones</button><button class="filter-pill" data-action="map-filter" data-map-filter="En tránsito">En tránsito</button><button class="filter-pill" data-action="map-filter" data-map-filter="En destino">En destino</button><button class="filter-pill" data-action="map-filter" data-map-filter="Incidencia">Con incidencia</button><button class="filter-pill" data-action="fit-map">Ajustar vista</button></div>' +
    '<section class="panel full-map-panel"><div class="panel-heading"><div><h2>Mapa de seguimiento</h2><p>Mapa de calles interactivo · selecciona un embarque para ver su trazo orientativo.</p></div><span class="demo-label"><i></i> CARTO Voyager</span></div>' +
    renderMap() + '<p class="map-disclaimer">Mapa CARTO Voyager con atribución a CARTO y OpenStreetMap. Los trazos son orientativos y no representan navegación logística en tiempo real; la ubicación del dispositivo solo se consulta si la activas.</p></section><section class="panel selected-route-panel"><div class="panel-heading"><div><h2>Rastreo de operación seleccionada</h2><p id="routeSummary">' + active.length + " operaciones con seguimiento activo</p></div><select id=\"routeSelect\" aria-label=\"Seleccionar operación\">" +
    operations.map((operation) => '<option value="' + escapeHTML(operation.id) + '">' + escapeHTML(operation.id + " · " + operation.origin + " → " + operation.destination) + "</option>").join("") +
    '</select></div><div class="route-overview" id="routeOverview">' + renderRouteOverview(operations[0]) + "</div></section>";
}

function renderRouteOverview(operation) {
  if (!operation) return '<div class="empty-state"><strong>Selecciona un embarque</strong><p>Los pasos del recorrido aparecerán cuando haya operaciones registradas.</p></div>';
  const steps = ["Operación registrada", "Documentación integrada", "Carga recibida por transportista", "Salida / despacho de origen", "Punto de tránsito o revisión", "Arribo a destino", "Entrega / cierre"];
  const completed = operation.progress >= 100 ? steps.length : Math.min(steps.length - 1, Math.floor(operation.progress / 16));
  return '<div class="route-strip"><div><small>' + escapeHTML(operation.id) + " · " + escapeHTML(operation.origin) + " → " + escapeHTML(operation.destination) +
    '</small><strong>' + statusPill(operation.status) + "</strong></div><div class=\"route-overview-progress\"><span style=\"width:" + operation.progress + '%"></span></div></div><div class="route-step-grid">' +
    steps.map((step, index) => '<div class="route-step ' + (index <= completed ? "route-step-done" : "") + '"><span>' + String(index + 1).padStart(2, "0") +
      "</span><strong>" + step + "</strong><small>" + (index < completed ? "Registrado" : index === completed ? "Etapa actual" : "Pendiente") + "</small></div>").join("") +
    "</div>";
}

function renderShipments() {
  const query = state.operationQuery.toLowerCase();
  const filtered = operations.filter((operation) =>
    [operation.id, operation.client, operation.origin, operation.destination, operation.transport, operation.item]
      .some((value) => value.toLowerCase().includes(query))
  );
  return pageHeading("shipments", '<button class="button button-primary" data-action="new-operation">＋ Registrar embarque</button>') +
    '<section class="panel"><div class="panel-heading"><div><h2>Administración de embarques</h2><p>Consulta y administra las referencias de importación y exportación.</p></div><span class="subtle-count">' +
    operations.length + " embarques guardados</span></div><div class=\"table-toolbar\"><label class=\"table-search\"><span>⌕</span><input id=\"operationSearch\" type=\"search\" value=\"" +
    escapeHTML(state.operationQuery) + '" placeholder="Buscar referencia, cliente o ruta..."></label><select id="statusFilter" aria-label="Filtrar por estado"><option value="">Todos los estados</option><option>En tránsito</option><option>Preparación</option><option>Incidencia</option><option>En destino</option></select></div>' +
    '<div id="operationTable">' + operationTable(filtered) + "</div></section>";
}

function renderTransport() {
  const modes = ["Marítimo", "Terrestre", "Aéreo", "Ferroviario"];
  const icons = ["▤", "▰", "✈", "▥"];
  const descriptions = ["Contenedores y carga consolidada", "Camiones y rutas nacionales", "Carga internacional prioritaria", "Tránsito de carga por tren"];
  const count = (mode) => operations.filter((operation) => operation.transport === mode).length;
  return pageHeading("transport", '<button class="button button-secondary" data-view="map">Ver mapa operativo ↗</button>') +
    '<section class="transport-kpis">' + modes.map((mode, index) =>
      '<article class="transport-kpi"><div><span>' + mode + '</span><b>' + icons[index] + '</b></div><strong>' + count(mode) +
      '</strong><small>' + descriptions[index] + "</small></article>"
    ).join("") + '</section><section class="panel"><div class="panel-heading"><div><h2>Operaciones por modalidad</h2><p>Vista basada en embarques registrados; aún no hay un catálogo persistente de unidades ni operadores.</p></div><span class="subtle-count">' +
    operations.length + " embarques</span></div><div class=\"table-scroll\"><table class=\"data-table\"><thead><tr><th>Referencia</th><th>Medio</th><th>Origen</th><th>Destino</th><th>Estado</th><th>Última actualización</th></tr></thead><tbody>" +
    (operations.length ? operations.map((operation) => "<tr><td><button class=\"text-action\" data-action=\"details\" data-id=\"" + escapeHTML(operation.id) + '">' +
      escapeHTML(operation.id) + "</button></td><td>" + escapeHTML(operation.transport) + "</td><td>" + escapeHTML(operation.origin) +
      "</td><td>" + escapeHTML(operation.destination) + "</td><td>" + statusPill(operation.status) +
      "</td><td>" + escapeHTML(operation.updated) + "</td></tr>").join("") : '<tr><td class="empty-cell" colspan="6">Aún no hay embarques guardados.</td></tr>') +
    "</tbody></table></div></section>";
}

function inventoryCategoryClass(category) {
  return ({
    "Electrónica": "electronics",
    Hogar: "home",
    Alimentos: "food",
    Ropa: "clothing",
    Refacciones: "parts",
    General: "general"
  })[category] || "general";
}

function renderInventory() {
  const categories = ["Todas", "Electrónica", "Hogar", "Alimentos", "Ropa", "Refacciones", "General"];
  const totalUnits = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const lowStock = inventoryItems.filter((item) => item.status !== "Disponible").length;
  const locatedCount = inventoryItems.filter((item) => Array.isArray(item.coords)).length;
  const categoryOptions = categories.map((category) => '<option value="' + category + '" ' +
    (category === state.inventoryCategory ? "selected" : "") + ">" + category + "</option>").join("");
  return pageHeading("inventory", '<button class="button button-primary" data-action="new-inventory-item">＋ Registrar producto</button>') +
    '<section class="metric-grid inventory-metrics">' +
    metricCard("Productos registrados", String(inventoryItems.length), "SKU únicos", "▣", "blue", "Inventario") +
    metricCard("Existencias totales", String(totalUnits), "Unidades en catálogo", "▤", "cyan", "Inventario") +
    metricCard("Stock bajo o agotado", String(lowStock), "Revisar reabastecimiento", "!", "amber", "Según mínimo configurado") +
    metricCard("Con ubicación en mapa", String(locatedCount), "Ubicación siempre opcional", "⌖", "green", "Mapa interactivo") +
    '</section><section class="panel inventory-map-panel"><div class="panel-heading"><div><h2>Mapa de inventario</h2><p>Productos ubicados, agrupables por categoría. Los artículos sin coordenadas permanecen en la lista.</p></div>' +
    '<div class="inventory-map-actions"><label class="mode-select"><span>Categoría</span><select id="inventoryMapFilter">' + categoryOptions + '</select></label>' +
    '<button class="button button-secondary" type="button" data-action="fit-inventory-map">Ajustar mapa</button></div></div>' +
    '<div class="inventory-map-stage"><div id="inventoryMap" class="leaflet-map" role="application" aria-label="Mapa de productos en inventario"></div>' +
    '<div class="map-load-error" id="inventoryMapLoadError" role="status" hidden><strong>No se pudo cargar el mapa de CARTO</strong><span>Comprueba tu conexión a internet.</span></div></div>' +
    '<div class="inventory-map-legend">' + categories.slice(1).map((category) =>
      '<span><i class="inventory-dot inventory-dot-' + inventoryCategoryClass(category) + '"></i>' + category + "</span>").join("") +
    '<span class="inventory-map-unlocated">' + (inventoryItems.length - locatedCount) + " sin ubicación</span></div></section>" +
    '<section class="panel inventory-table-panel"><div class="panel-heading"><div><h2>Existencias registradas</h2><p>Consulta cantidades y actualiza el stock disponible.</p></div><span class="subtle-count">' +
    inventoryItems.length + " productos</span></div><div class=\"table-toolbar\"><label class=\"table-search\"><span>⌕</span><input id=\"inventorySearch\" type=\"search\" value=\"" +
    escapeHTML(state.inventoryQuery) + '" placeholder="Buscar por SKU, producto o ubicación..."></label><select id="inventoryCategoryFilter" aria-label="Filtrar inventario por categoría">' +
    categoryOptions + '</select></div><div class="table-scroll"><table class="data-table"><thead><tr><th>SKU</th><th>Producto</th><th>Categoría</th><th>Existencias</th><th>Estado</th><th>Ubicación</th><th>Acción</th></tr></thead><tbody id="inventoryTableBody">' +
    renderInventoryRows(getFilteredInventory()) + "</tbody></table></div></section>";
}

function getFilteredInventory() {
  const query = state.inventoryQuery.toLowerCase();
  return inventoryItems.filter((item) =>
    (state.inventoryCategory === "Todas" || item.category === state.inventoryCategory) &&
    [item.sku, item.name, item.category, item.location].some((value) => value.toLowerCase().includes(query))
  );
}

function renderInventoryRows(items) {
  if (!items.length) {
    return '<tr><td class="empty-cell" colspan="7">' + (inventoryItems.length
      ? "No hay productos con esos filtros."
      : "Aún no hay productos. Registra el primero para comenzar el inventario.") + "</td></tr>";
  }
  return items.map((item) => '<tr><td><strong>' + escapeHTML(item.sku) + "</strong></td><td>" + escapeHTML(item.name) +
    "</td><td>" + escapeHTML(item.category) + '</td><td><strong>' + item.quantity + " " + escapeHTML(item.unit) +
    "</strong></td><td>" + statusPill(item.status) + "</td><td>" + escapeHTML(item.location || "Sin ubicación") +
    '</td><td><button class="table-action" data-action="adjust-inventory" data-id="' + item.id + '">Ajustar stock</button></td></tr>').join("");
}

function initializeInventoryMap() {
  const mapElement = document.getElementById("inventoryMap");
  if (!mapElement) return;
  disposeInventoryMap();
  if (!cartoBasemapApiKey) {
    showMissingCartoApiKey("inventoryMapLoadError");
    return;
  }
  try {
    inventoryMap = createCartoMap(mapElement, "inventoryMapLoadError");
  } catch (error) {
    console.error("No se pudo inicializar el mapa de inventario.", error);
    showMapLoadError("inventoryMapLoadError", "No se pudo inicializar el mapa", "Comprueba que Leaflet se haya cargado y que tengas conexión a internet.");
    return;
  }
  inventoryItems.filter((item) => Array.isArray(item.coords)).forEach((item) => {
    const marker = createMapMarker(
      inventoryMap,
      item.coords,
      "inventory-pin inventory-pin-" + inventoryCategoryClass(item.category),
      item.sku + " · " + item.name
    );
    marker.on("click", () => openMapInfoWindow(
      inventoryMap,
      marker,
      '<div class="map-popup"><span>INVENTARIO · ' + escapeHTML(item.sku) + "</span><strong>" + escapeHTML(item.name) +
        "</strong><small>" + escapeHTML(item.category) + " · " + item.quantity + " " + escapeHTML(item.unit) +
        "</small><small>" + escapeHTML(item.location || "Ubicación registrada") + "</small><small>Estado: " + escapeHTML(item.status) + "</small></div>"
    ));
    inventoryMapMarkers.push({ item, marker });
    if (state.inventoryCategory !== "Todas" && item.category !== state.inventoryCategory) {
      setMapMarkerVisible(inventoryMap, marker, false);
    }
  });
  fitInventoryMap();
}

function fitInventoryMap(showError = false) {
  if (!inventoryMap) return;
  const visible = inventoryMapMarkers.filter((entry) =>
    state.inventoryCategory === "Todas" || entry.item.category === state.inventoryCategory
  );
  if (!visible.length) {
    if (showError) toast("No hay productos con ubicación para esta categoría.", "error");
    return;
  }
  const bounds = window.L.latLngBounds(visible.map((entry) => entry.marker.getLatLng()));
  if (visible.length === 1) {
    inventoryMap.setView(bounds.getCenter(), 8, { animate: false });
  } else {
    inventoryMap.fitBounds(bounds, { padding: [56, 56], animate: false });
  }
}

function updateInventoryCategory(category) {
  state.inventoryCategory = category;
  ["inventoryMapFilter", "inventoryCategoryFilter"].forEach((id) => {
    const select = document.getElementById(id);
    if (select) select.value = category;
  });
  document.getElementById("inventoryTableBody").innerHTML = renderInventoryRows(getFilteredInventory());
  inventoryMapMarkers.forEach((entry) => {
    const visible = category === "Todas" || entry.item.category === category;
    setMapMarkerVisible(inventoryMap, entry.marker, visible);
  });
  fitInventoryMap();
}

function renderDocuments() {
  const docs = transportDocuments[state.documentMode] || transportDocuments.Marítimo;
  const selectedOperation = operations.find((operation) => operation.id === state.documentOperation) || operations[0];
  if (selectedOperation) state.documentOperation = selectedOperation.id;
  const checked = selectedOperation && state.checkedDocuments[selectedOperation.id] &&
    state.checkedDocuments[selectedOperation.id][state.documentMode] || [];
  return pageHeading("documents", '<span class="demo-label"><i></i> Checklist persistente</span>') +
    '<section class="panel docs-panel"><div class="panel-heading"><div><h2>Documentación según el transporte</h2><p>El checklist se guarda por embarque en la base de datos.</p></div><div class="docs-select-group"><label class="mode-select"><span>Embarque</span><select id="documentOperation">' +
    operations.map((operation) => '<option value="' + escapeHTML(operation.id) + '" ' + (operation.id === state.documentOperation ? "selected" : "") + ">" +
      escapeHTML(operation.id + " · " + operation.client) + "</option>").join("") +
    '</select></label><label class="mode-select"><span>Medio</span><select id="documentMode">' +
    Object.keys(transportDocuments).map((mode) => '<option ' + (mode === state.documentMode ? "selected" : "") + ">" + mode + "</option>").join("") +
    '</select></label></div><div class="docs-summary"><div><strong id="docsCount">' + checked.length + " / " + docs.length +
    '</strong><span>documentos revisados</span></div><div class="bar-track"><span id="docsProgress" style="width:' + (checked.length / docs.length * 100) + '%"></span></div>' +
    '<span id="docsCompletion">' + statusPill(checked.length === docs.length ? "Completo" : "En revisión") + '</span></div>' +
    (!selectedOperation ? '<div class="empty-state"><strong>Selecciona un embarque</strong><p>Registra una operación para habilitar el checklist documental.</p></div>' : '<div class="notice notice-info docs-guidance"><span>i</span><p><strong>Cómo usarlo:</strong> marca cada requisito conforme se integra al expediente. “Base” es una referencia inicial; “Condicional” requiere confirmar si aplica a la mercancía, ruta y destino. Cada embarque conserva su propio avance.</p></div><div class="checklist">' +
    docs.map((doc, index) => '<label class="checklist-row"><input type="checkbox" data-doc-index="' + index + '" ' + (checked.includes(index) ? "checked" : "") +
      '><span class="custom-check"></span><span class="checklist-copy"><strong>' + escapeHTML(doc[0]) + '</strong><small>' +
      escapeHTML(describeDocument(doc[0])) +
      "</small></span><span class=\"doc-tag " + (doc[1] === "Base" ? "doc-tag-base" : "doc-tag-conditional") + '">' + doc[1] + "</span></label>").join("") + '</div>') +
    '<div class="notice notice-info"><span>i</span><p>La lista es orientativa. Los requisitos cambian según ruta, mercancía, país y operación. Confirma los documentos con el agente o autoridad correspondiente.</p></div></section>';
}

function renderTransportDocuments() {
  return pageHeading("transport-documents", '<button class="button button-secondary" data-view="documents">Abrir checklist documental →</button>') +
    '<div class="transport-doc-grid">' + Object.keys(transportDocuments).map((mode) =>
      '<button class="transport-doc-card" data-action="open-doc-mode" data-mode="' + mode + '"><span class="transport-doc-icon">' +
      ({ Marítimo: "◉", Terrestre: "▰", Aéreo: "✈", Ferroviario: "▥", Multimodal: "◇", Carretero: "▣" })[mode] +
      '</span><span><small>DOCUMENTOS PARA</small><strong>' + mode + '</strong><em>' + transportDocuments[mode].length + " requisitos de referencia</em></span><b>→</b></button>"
    ).join("") + '</div><section class="panel info-panel"><div class="panel-heading"><div><h2>Documento principal por modalidad</h2><p>Selecciona una tarjeta para abrir y revisar su lista de documentos.</p></div></div><div class="document-highlight-grid">' +
    [["Marítimo", "B/L", "Contrato y recibo de carga; puede ser título negociable según cómo se emita."], ["Aéreo", "AWB", "Acredita el contrato y recepción; no es negociable ni título de propiedad."], ["Terrestre", "CMR", "Para rutas reguladas por convenio, detalla trayecto, carga y responsabilidades."], ["Ferroviario", "CIM", "Carta de porte para el traslado ferroviario de mercancías."], ["Multimodal", "FBL", "Ampara varios medios bajo un contrato; puede ser negociable si se emite a la orden."]]
      .map((item) => '<article><span>' + item[1] + '</span><div><strong>' + item[0] + '</strong><p>' + item[2] + "</p></div></article>").join("") +
    "</div></section>" +
    '<section class="panel info-panel common-documents-panel"><div class="panel-heading"><div><h2>Documentos base y complementarios</h2><p>Se combinan con el documento principal según mercancía, país y operación.</p></div></div><div class="common-document-grid">' +
    [
      ["Factura comercial internacional", "Comprador, vendedor, mercancía, precios, moneda y condiciones de venta como el Incoterm."],
      ["Packing list · lista de empaque", "Bultos, contenido, peso y dimensiones por paquete; normalmente no incluye precios."],
      ["Certificado de seguro de transporte", "Cobertura, vigencia, riesgos amparados y procedimiento ante daños o pérdidas."],
      ["Declaración o manifiesto aduanero", "Información para el control y despacho de importación o exportación, como el pedimento en México."],
      ["Certificados y permisos", "Origen, requisitos sanitarios o fitosanitarios, inspección y permisos sectoriales según el producto y destino."],
      ["Complemento Carta Porte · México", "Complemento del CFDI para traslados nacionales cuando corresponde; validar reglas y excepciones vigentes."]
    ].map((item) => '<article><span aria-hidden="true">▤</span><div><strong>' + item[0] + '</strong><p>' + item[1] + "</p></div></article>").join("") +
    '</div><p class="document-legal-note">Guía informativa: no sustituye la revisión de un agente aduanal, transportista o autoridad competente. Los nombres, formatos y obligaciones pueden variar.</p></section>';
}

function renderRisk() {
  const selectedOperation = operations.find((operation) => operation.id === state.riskOperation) || operations[0];
  if (selectedOperation) {
    state.riskOperation = selectedOperation.id;
    state.risk = { ...selectedOperation.risk };
  }
  const riskItems = [
    ["delay", "Retraso en entrega", "Demoras de ruta, terminal o conexión", "clock"],
    ["damage", "Daño de mercancía", "Manejo, embalaje y condiciones de transporte", "box"],
    ["customs", "Retención o revisión aduanera", "Documentación, clasificación y controles", "customs"],
    ["weather", "Afectación por clima", "Condiciones meteorológicas en ruta", "cloud"],
    ["loss", "Extravío o pérdida", "Trazabilidad y controles de custodia", "alert"]
  ];
  const average = Math.round(Object.values(state.risk).reduce((sum, value) => sum + value, 0) / riskItems.length);
  const level = average < 20 ? "MODERADO / BAJO" : average < 40 ? "MODERADO" : "ELEVADO";
  return pageHeading("risk", '<span class="demo-label demo-label-amber">Modelo referencial</span>') +
    '<section class="panel risk-panel"><div class="panel-heading"><div><h2>Panel de probabilidades y riesgos</h2><p>Explora escenarios hipotéticos que pueden afectar a una operación.</p></div><label class="mode-select"><span>Operación</span><select id="riskOperation">' +
    operations.map((operation) => '<option value="' + escapeHTML(operation.id) + '" ' + (operation.id === state.riskOperation ? "selected" : "") + ">" +
      escapeHTML(operation.id + " · " + operation.client) + "</option>").join("") +
    '</select></label></div><div class="risk-cards">' + riskItems.map((item) =>
      '<article class="risk-card"><div class="risk-title"><strong>' + item[1] + '</strong><span>＋</span></div><strong class="risk-value" id="riskValue-' + item[0] + '">' + state.risk[item[0]] +
      '%</strong><div class="risk-meter"><span class="risk-color-' + item[0] + '" id="riskMeter-' + item[0] + '" style="width:' + state.risk[item[0]] +
      '%"></span></div><small>' + item[2] + '</small><label class="range-label" for="risk-' + item[0] + '">Ajustar estimación</label><input id="risk-' + item[0] +
      '" class="risk-range" type="range" min="0" max="100" value="' + state.risk[item[0]] + '" data-risk="' + item[0] + '"></article>'
    ).join("") + '</div><div class="risk-overview"><span>Nivel general orientativo:</span><strong id="riskLevel">' + level +
    '</strong><span class="risk-average" id="riskAverage">' + average + "% promedio</span></div><p class=\"disclaimer\">Estimaciones ajustables para fines demostrativos; no son predicciones, garantías ni recomendaciones de seguridad. Un análisis real requiere datos verificados y modelos adecuados.</p></section>" +
    '<section class="panel"><div class="panel-heading"><div><h2>Factores que influyen en el riesgo</h2><p>Variables a revisar antes y durante el trayecto.</p></div></div><div class="factor-grid"><article><strong>Ruta y condiciones</strong><p>Distancia, clima, congestión, seguridad y puntos de transferencia.</p></article><article><strong>Tipo de mercancía</strong><p>Fragilidad, temperatura, valor, manejo especial y embalaje.</p></article><article><strong>Documentación</strong><p>Expediente incompleto, permisos, certificados y datos inconsistentes.</p></article></div></section>';
}

function renderCustoms() {
  const reviews = customsReviews;
  const countStatus = (status) => reviews.filter((review) => review.status === status).length;
  return pageHeading("customs", '<button class="button button-secondary" data-action="customs-note">＋ Registrar revisión</button>') +
    '<div class="metric-grid metric-grid-compact">' + metricCard("En revisión", String(countStatus("En revisión")), "Expedientes en validación", "◷", "blue", "Base de datos") +
    metricCard("Liberados", String(countStatus("Liberado")), "Con estatus liberado", "✓", "green", "Base de datos") +
    metricCard("Retenidos", String(countStatus("Retenido")), "Requieren atención", "!", "amber", "Base de datos") +
    metricCard("Pendientes", String(countStatus("Pendiente")), "Por revisar", "▤", "cyan", "Base de datos") +
    '</div><section class="panel"><div class="panel-heading"><div><h2>Control de despachos</h2><p>Registros de revisión aduanera guardados localmente.</p></div><span class="subtle-count">' +
    reviews.length + " registros</span></div><div class=\"table-scroll\"><table class=\"data-table\"><thead><tr><th>Referencia aduanal</th><th>Embarque</th><th>Tipo</th><th>Aduana</th><th>Estado</th><th>Última actualización</th><th>Acción</th></tr></thead><tbody>" +
    (reviews.length ? reviews.map((review) => "<tr><td><strong>" + escapeHTML(review.reference) + "</strong></td><td>" + escapeHTML(review.operation || "Sin asignar") +
      "</td><td>" + escapeHTML(review.type) + "</td><td>" + escapeHTML(review.office) +
      "</td><td>" + statusPill(review.status) + '</td><td>' + escapeHTML(review.updated) + '</td><td><button class="table-action" data-action="customs-detail" data-ref="' + escapeHTML(review.reference) +
      '">Revisar</button></td></tr>').join("") : '<tr><td class="empty-cell" colspan="7">Aún no hay revisiones aduaneras guardadas.</td></tr>') + "</tbody></table></div></section>" +
    '<div class="notice notice-warn"><span>!</span><p>Los requisitos y etapas aduaneras dependen del país, producto y régimen. Esta vista es ilustrativa y no sustituye la asesoría de un agente aduanal.</p></div>';
}

function renderClients() {
  return pageHeading("clients", '<button class="button button-primary" data-action="new-client">＋ Agregar cliente</button>') +
    '<section class="panel"><div class="panel-heading"><div><h2>Directorio de clientes</h2><p>Contactos y actividad guardados en la base de datos.</p></div><span class="subtle-count">' +
    clients.length + " cuentas</span></div><div class=\"table-scroll\"><table class=\"data-table\"><thead><tr><th>Cliente</th><th>País</th><th>Contacto</th><th>Operaciones</th><th>Estado</th><th>Acción</th></tr></thead><tbody>" +
    clients.map((client, index) => "<tr><td><div class=\"client-cell\"><span class=\"client-avatar avatar-" + (index % 4) + "\">" + escapeHTML(client.name.charAt(0)) +
      "</span><strong>" + escapeHTML(client.name) + "</strong></div></td><td>" + escapeHTML(client.country) + "</td><td>" + escapeHTML(client.contact) +
      "</td><td>" + client.operations + "</td><td>" + statusPill(client.status) + '</td><td><button class="table-action" data-action="client-info" data-name="' +
      escapeHTML(client.name) + '">Ver cuenta</button></td></tr>').join("") + "</tbody></table></div></section>" +
    '<div class="client-summary-grid"><article class="panel"><span class="summary-icon">♙</span><strong>' + clients.length +
    '</strong><p>Clientes en directorio</p></article><article class="panel"><span class="summary-icon">▣</span><strong>' +
    operations.length + '</strong><p>Operaciones vinculadas</p></article><article class="panel"><span class="summary-icon">◉</span><strong>' +
    clients.filter((client) => client.status === "Activo").length + "</strong><p>Cuentas activas</p></article></div>";
}

function renderAlerts() {
  const activeAlerts = alerts.filter((alert) => alert.open);
  return pageHeading("alerts", '<button class="button button-secondary" data-action="mark-all-alerts">Marcar todas revisadas</button>') +
    '<div class="alert-summary-grid"><article class="panel alert-summary alert-summary-high"><span>Alta prioridad</span><strong>' +
    activeAlerts.filter((alert) => alert.severity === "Alta").length + '</strong><small>Atención inmediata</small></article><article class="panel alert-summary alert-summary-medium"><span>Prioridad media</span><strong>' +
    activeAlerts.filter((alert) => alert.severity === "Media").length + '</strong><small>Seguimiento recomendado</small></article><article class="panel alert-summary alert-summary-closed"><span>Resueltas</span><strong>' +
    alerts.filter((alert) => !alert.open).length + '</strong><small>Registros de la base</small></article></div><section class="panel"><div class="panel-heading"><div><h2>Bandeja de alertas</h2><p>Alertas registradas y asociadas con operaciones.</p></div><select id="alertFilter" aria-label="Filtrar alertas"><option value="open">Abiertas</option><option value="all">Todas</option></select></div><div class="alert-list" id="alertList">' +
    renderAlertItems(activeAlerts) + "</div></section>";
}

function renderAlertItems(items) {
  if (!items.length) return '<div class="empty-state"><span>✓</span><strong>Todo en orden</strong><p>No hay alertas para mostrar con este filtro.</p></div>';
  return items.map((alert) => '<article class="alert-row ' + (alert.open ? "" : "alert-resolved") + '"><span class="alert-mark alert-mark-' +
    (alert.severity === "Alta" ? "high" : "medium") + '">' + (alert.severity === "Alta" ? "!" : "◷") + '</span><div class="alert-copy"><div><strong>' +
    escapeHTML(alert.title) + "</strong> " + statusPill(alert.severity) + "</div><p>" + escapeHTML(alert.operation) + " · " + escapeHTML(alert.area) + " · " +
    escapeHTML(alert.time) + '</p></div><button class="table-action" data-action="resolve-alert" data-id="' + escapeHTML(alert.id) + '">' +
    (alert.open ? "Resolver" : "Reabrir") + "</button></article>").join("");
}

function renderReports() {
  const months = monthlyOperationCounts().slice(-state.reportMonths);
  const maximum = Math.max(1, ...months.map((month) => month.count));
  const delivered = operations.filter((operation) => operation.status === "En destino").length;
  const averageProgress = operations.length
    ? Math.round(operations.reduce((total, operation) => total + Number(operation.progress), 0) / operations.length)
    : 0;
  const modes = ["Marítimo", "Terrestre", "Carretero", "Aéreo", "Ferroviario", "Multimodal"].map((mode) => {
    const count = operations.filter((operation) => operation.transport === mode).length;
    return [mode, operations.length ? Math.round(count / operations.length * 100) : 0];
  });
  return pageHeading("reports", '<button class="button button-primary" data-action="export-report">↓ Exportar CSV</button>') +
    '<section class="report-filter panel"><div><h2>Resumen de desempeño</h2><p>Indicadores calculados a partir de los registros guardados.</p></div><select id="reportPeriod" aria-label="Periodo del reporte"><option value="12" ' + (state.reportMonths === 12 ? "selected" : "") +
    '>Últimos 12 meses</option><option value="6" ' + (state.reportMonths === 6 ? "selected" : "") + '>Últimos 6 meses</option><option value="3" ' +
    (state.reportMonths === 3 ? "selected" : "") + '>Últimos 3 meses</option></select></section>' +
    '<div class="metric-grid metric-grid-compact">' + metricCard("Embarques gestionados", String(operations.length), "Total de registros", "▣", "blue", "Base de datos") +
    metricCard("Entregas en destino", String(delivered), "Operaciones completadas", "✓", "green", "Base de datos") +
    metricCard("Avance promedio", averageProgress + "%", "Progreso registrado", "◷", "cyan", "Base de datos") +
    metricCard("Alertas abiertas", String(alerts.filter((alert) => alert.open).length), "Pendientes de revisión", "!", "amber", "Base de datos") +
    '</div><section class="report-grid"><article class="panel chart-panel"><div class="panel-heading"><div><h2>Volumen de embarques</h2><p id="reportChartCaption">Embarques registrados por mes</p></div><span class="chart-legend"><i></i> Embarques</span></div><div class="bar-chart">' +
    months.map((item) => '<div class="chart-column"><span class="chart-bar" style="height:' + (item.count ? Math.max(8, item.count / maximum * 100) : 3) +
      '%" title="' + item.count + ' operaciones"></span><small>' + item.label + "</small></div>").join("") +
    '</div></article><article class="panel"><div class="panel-heading"><div><h2>Distribución por transporte</h2><p>Participación de los registros guardados</p></div></div><div class="mode-stat-list">' +
    modes.map((item) =>
      '<div><span>' + item[0] + '</span><strong>' + item[1] + '%</strong><div class="bar-track"><span style="width:' + item[1] + '%"></span></div></div>'
    ).join("") + "</div></article></section>";
}

function openModal(title, eyebrow, content, wide = false) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalEyebrow").textContent = eyebrow;
  document.getElementById("modalContent").innerHTML = content;
  document.querySelector(".modal-card").classList.toggle("modal-wide", wide);
  modalBackdrop.hidden = false;
  document.body.classList.add("modal-open");
  const focusable = modalBackdrop.querySelector("input, select, button, textarea");
  if (focusable) focusable.focus();
}

function closeModal() {
  modalBackdrop.hidden = true;
  document.body.classList.remove("modal-open");
}

modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop || event.target.closest("[data-close-modal]")) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalBackdrop.hidden) closeModal();
});

function openNewOperation() {
  state.newOperationLocation = null;
  openModal("Registrar embarque", "NUEVA OPERACIÓN", '<form id="newOperationForm" class="modal-form">' +
    '<div class="form-grid"><label>Cliente<input name="client" required placeholder="Nombre del cliente"></label><label>Producto / mercancía<input name="item" required placeholder="Ej. Licuadora profesional"></label>' +
    '<label>Origen<input name="origin" required placeholder="Ciudad, país"></label><label>Destino de entrega<input name="destination" required placeholder="Dirección o ciudad de entrega"></label>' +
    '<label>Recibe<input name="recipient" placeholder="Nombre de quien recibe"></label><label>Medio de transporte<select name="transport"><option>Marítimo</option><option>Terrestre</option><option>Carretero</option><option>Aéreo</option><option>Ferroviario</option><option>Multimodal</option></select></label>' +
    '<label>Cantidad<input name="quantity" type="number" min="1" value="1" required></label><label>Precio estimado por unidad (MXN)<input name="price" type="number" min="0" step="0.01" value="0"></label>' +
    '<label class="form-full">Dirección completa<input name="address" id="newOperationAddress" placeholder="Calle, número, colonia, ciudad y CP"></label></div>' +
    '<div class="modal-form-actions"><button class="text-action" type="button" data-action="use-current-location">⌖ Usar ubicación de este dispositivo</button><span>Ubicación opcional; requiere permiso.</span></div>' +
    '<div class="notice notice-info"><span>i</span><p>El registro se guardará en la base de datos local. La dirección puede escribirse manualmente o completarse con la ubicación del dispositivo.</p></div>' +
    '<button class="button button-primary modal-submit" type="submit">Guardar embarque <span>→</span></button></form>', true);
  document.getElementById("newOperationForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const operationData = {
      client: String(form.get("client")).trim(),
      item: String(form.get("item")).trim(),
      origin: String(form.get("origin")).trim(),
      destination: String(form.get("destination")).trim(),
      transport: String(form.get("transport")),
      recipient: String(form.get("recipient")).trim() || "Por confirmar",
      address: String(form.get("address")).trim() || String(form.get("destination")).trim(),
      quantity: Number(form.get("quantity")) || 1,
      price: Number(form.get("price")) || 0,
      coords: state.newOperationLocation ? [state.newOperationLocation.latitude, state.newOperationLocation.longitude] : null
    };
    let result;
    try {
      result = await apiRequest("/api/operations/", "POST", operationData);
    } catch (error) {
      toast(error.message, "error");
      return;
    }
    const operation = result.operation;
    updateOperationCache(operation);
    updateClientCache(result.client);
    state.newOperationLocation = null;
    closeModal();
    toast("Embarque " + operation.id + " guardado en la base de datos.");
    navigate("shipments");
    openOperationDetails(operation.id);
  });
}

function openOperationDetails(id) {
  const operation = operations.find((item) => item.id === id);
  if (!operation) return;
  const steps = ["Compra y registro", "Pago / autorización", "Preparación de carga", "Salida del almacén", "En transporte", "Reparto local", "Entrega"];
  const activeStep = operation.progress >= 100 ? steps.length : Math.min(steps.length - 1, Math.floor(operation.progress / 16.7));
  const deliveryCelebration = operation.progress >= 100
    ? '<section class="delivery-celebration" role="status"><div class="delivery-scene" aria-hidden="true"><span class="delivery-flight-path"></span><span class="delivery-plane">✈</span><span class="delivery-package">📦</span><span class="delivery-check">✓</span></div><div class="delivery-copy"><small>SIMULACIÓN COMPLETADA</small><strong>¡Paquete recibido!</strong><p>' + escapeHTML(operation.item) + " llegó a " + escapeHTML(operation.destination) + ".</p></div></section>"
    : "";
  openModal(operation.id + " · Seguimiento", "RASTRO DE OPERACIÓN", deliveryCelebration + '<div class="detail-summary"><div><span>CLIENTE</span><strong>' + escapeHTML(operation.client) +
    '</strong></div><div><span>MERCANCÍA</span><strong>' + escapeHTML(operation.item) + '</strong></div><div><span>RUTA</span><strong>' + escapeHTML(operation.origin) + " → " + escapeHTML(operation.destination) +
    '</strong></div><div><span>TRANSPORTE / ESTADO</span><strong>' + escapeHTML(operation.transport) + " · " + statusPill(operation.status) + '</strong></div></div>' +
    '<div class="detail-progress"><div><strong>Progreso del recorrido</strong><span>' + operation.progress + '% · ETA ' + escapeHTML(operation.eta) +
    '</span></div><div class="table-progress"><span style="width:' + operation.progress + '%"></span></div></div><div class="detail-timeline">' +
    steps.map((step, index) => '<div class="detail-step ' + (index < activeStep ? "done" : index === activeStep ? "current" : "") + '"><span>' + (index < activeStep ? "✓" : index + 1) +
      "</span><div><strong>" + step + "</strong><small>" + (index < activeStep ? "Etapa registrada" : index === activeStep ? "Etapa actual" : "Pendiente") + "</small></div></div>").join("") +
    '</div><div class="detail-actions">' + (operation.progress >= 100
      ? '<button class="button button-secondary" type="button" disabled>✓ Simulación completada</button>'
      : '<button class="button button-secondary" data-action="advance-operation" data-id="' + operation.id + '">Avanzar simulación +15%</button>') +
    '<button class="button button-primary" data-action="invoice" data-id="' + operation.id + '">Ver comprobante demo</button></div>' +
    '<p class="modal-footnote">Seguimiento de demostración. La ruta y los tiempos son ilustrativos, no una actualización logística real.</p>', true);
}

function openInvoice(operation) {
  const total = operation.price * operation.quantity;
  const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
  openModal("Comprobante de compra · " + operation.id, "VISTA PREVIA · NO FISCAL", '<article class="invoice-paper" id="printInvoice">' +
    '<header class="invoice-header"><div><p class="eyebrow">COMPROBANTE DE DEMOSTRACIÓN</p><h3>Resumen de compra</h3></div><img class="invoice-logo" src="' + window.INFINITY_STATIC_BASE + 'Image/Infinityoperaciones2.jpeg" alt="Infinity Operations"></header>' +
    '<div class="invoice-meta-grid"><div><small>FOLIO</small><strong>DEMO-' + escapeHTML(operation.id) + '</strong></div><div><small>FECHA</small><strong>' +
    new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date()) + '</strong></div><div><small>ESTADO</small><strong>Pedido de demostración</strong></div></div>' +
    '<div class="invoice-recipient"><div><small>RECIBE</small><strong>' + escapeHTML(operation.recipient) + '</strong></div><div><small>DIRECCIÓN DE ENTREGA</small><strong>' +
    escapeHTML(operation.address) + '</strong></div></div><div class="table-scroll"><table class="data-table invoice-table"><thead><tr><th>Descripción</th><th>Cantidad</th><th>Precio unitario</th><th>Importe</th></tr></thead><tbody><tr><td>' +
    escapeHTML(operation.item) + "</td><td>" + operation.quantity + "</td><td>" + currency.format(operation.price) + "</td><td>" + currency.format(total) +
    '</td></tr></tbody></table></div><div class="invoice-grand-total"><span>Total estimado</span><strong>' + currency.format(total) +
    '</strong></div><p class="invoice-warning">Documento ilustrativo, no es factura fiscal, CFDI ni comprobante de pago.</p></article><button class="button button-primary print-button" data-action="print-invoice">Imprimir / Guardar PDF</button>', true);
}

function openNewClient() {
  openModal("Agregar cliente", "DIRECTORIO", '<form id="newClientForm" class="modal-form"><div class="form-grid"><label>Nombre o razón social<input name="name" required></label>' +
    '<label>País<input name="country" required></label><label>Persona de contacto<input name="contact" required></label><label>Correo de contacto<input name="email" type="email" placeholder="contacto@empresa.com"></label></div>' +
    '<div class="notice notice-info"><span>i</span><p>El contacto se guardará en el directorio de clientes.</p></div><button class="button button-primary modal-submit" type="submit">Guardar cliente</button></form>');
  document.getElementById("newClientForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let result;
    try {
      result = await apiRequest("/api/clients/", "POST", {
        name: String(form.get("name")).trim(),
        country: String(form.get("country")).trim(),
        contact: String(form.get("contact")).trim(),
        email: String(form.get("email")).trim()
      });
    } catch (error) {
      toast(error.message, "error");
      return;
    }
    updateClientCache(result.client);
    closeModal();
    renderView("clients");
    toast("Cliente guardado en la base de datos.");
  });
}

function showClient(name) {
  const client = clients.find((item) => item.name === name);
  if (!client) return;
  const clientOperations = operations.filter((operation) => operation.client === name);
  openModal("Cuenta de cliente", "DIRECTORIO", '<div class="client-detail"><span class="client-avatar avatar-0">' + escapeHTML(client.name.charAt(0)) +
    '</span><div><h3>' + escapeHTML(client.name) + '</h3><p>' + escapeHTML(client.country) + " · Contacto: " + escapeHTML(client.contact) +
    '</p><p>' + client.operations + " operaciones registradas en la base de datos.</p></div></div><h3 class=\"modal-section-title\">Operaciones asociadas</h3>" +
    (clientOperations.length ? operationTable(clientOperations) : '<div class="empty-state"><strong>Sin operaciones asociadas</strong></div>'), true);
}

function openNewInventoryItem() {
  state.inventoryLocation = null;
  openModal("Registrar producto", "INVENTARIO", '<form id="newInventoryItemForm" class="modal-form">' +
    '<div class="form-grid"><label>SKU / Código<input name="sku" required maxlength="60" placeholder="Ej. LIC-001"></label>' +
    '<label>Nombre del producto<input name="name" required maxlength="180" placeholder="Ej. Licuadora"></label>' +
    '<label>Categoría<select name="category"><option>Electrónica</option><option>Hogar</option><option>Alimentos</option><option>Ropa</option><option>Refacciones</option><option selected>General</option></select></label>' +
    '<label>Existencias iniciales<input name="quantity" type="number" min="0" step="1" value="0" required></label>' +
    '<label>Unidad<select name="unit"><option value="pieza">Pieza(s)</option><option value="caja">Caja(s)</option><option value="paquete">Paquete(s)</option><option value="kg">Kilogramos</option><option value="litro">Litros</option></select></label>' +
    '<label>Mínimo para alerta de stock bajo<input name="lowStockThreshold" type="number" min="0" step="1" value="5" required></label>' +
    '<label class="form-full">Almacén / ubicación descriptiva <span class="optional-label">Opcional</span><input name="location" maxlength="220" placeholder="Ej. Bodega central, Puebla"></label>' +
    '<label>Latitud <span class="optional-label">Opcional</span><input id="inventoryLatitude" name="latitude" type="number" min="-90" max="90" step="any" placeholder="19.4326"></label>' +
    '<label>Longitud <span class="optional-label">Opcional</span><input id="inventoryLongitude" name="longitude" type="number" min="-180" max="180" step="any" placeholder="-99.1332"></label></div>' +
    '<div class="modal-form-actions"><button class="text-action" type="button" data-action="inventory-use-location">⌖ Usar ubicación de este dispositivo</button><span>Solo se consulta si presionas el botón.</span></div>' +
    '<div class="notice notice-info"><span>i</span><p>La ubicación es opcional. Sin coordenadas, el producto se registra normalmente y no aparece como marcador en el mapa.</p></div>' +
    '<button class="button button-primary modal-submit" type="submit">Guardar producto</button></form>', true);
  document.getElementById("newInventoryItemForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const latitude = String(form.get("latitude")).trim();
    const longitude = String(form.get("longitude")).trim();
    if (Boolean(latitude) !== Boolean(longitude)) {
      toast("Para ubicar el producto, completa tanto latitud como longitud.", "error");
      return;
    }
    const data = {
      sku: String(form.get("sku")).trim(),
      name: String(form.get("name")).trim(),
      category: String(form.get("category")),
      quantity: Number(form.get("quantity")),
      unit: String(form.get("unit")),
      lowStockThreshold: Number(form.get("lowStockThreshold")),
      location: String(form.get("location")).trim(),
      coords: latitude ? [Number(latitude), Number(longitude)] : null
    };
    let result;
    try {
      result = await apiRequest("/api/inventory/", "POST", data);
    } catch (error) {
      toast(error.message, "error");
      return;
    }
    inventoryItems.push(result.item);
    closeModal();
    state.inventoryQuery = "";
    state.inventoryCategory = "Todas";
    renderView("inventory");
    toast("Producto " + result.item.sku + " guardado en el inventario.");
  });
}

function openAdjustInventory(itemId) {
  const item = inventoryItems.find((entry) => entry.id === itemId);
  if (!item) return;
  openModal("Ajustar existencias · " + item.sku, "INVENTARIO", '<form id="adjustInventoryForm" class="modal-form">' +
    '<p class="inventory-adjust-product"><strong>' + escapeHTML(item.name) + "</strong><span>" + escapeHTML(item.category) + "</span></p>" +
    '<label>Nueva cantidad en ' + escapeHTML(item.unit) + '<input name="quantity" type="number" min="0" step="1" value="' + item.quantity + '" required></label>' +
    '<p class="modal-footnote">Al guardar se actualizará el estado de stock según el mínimo de ' + item.lowStockThreshold + " unidades.</p>" +
    '<button class="button button-primary modal-submit" type="submit">Guardar existencias</button></form>');
  document.getElementById("adjustInventoryForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const quantity = Number(new FormData(event.currentTarget).get("quantity"));
    let result;
    try {
      result = await apiRequest("/api/inventory/" + item.id + "/stock/", "POST", { quantity });
    } catch (error) {
      toast(error.message, "error");
      return;
    }
    const index = inventoryItems.findIndex((entry) => entry.id === item.id);
    if (index !== -1) inventoryItems[index] = result.item;
    closeModal();
    renderView("inventory");
    toast("Existencias actualizadas para " + item.sku + ".");
  });
}

function updateRisk(key, value) {
  const numericValue = Math.max(0, Math.min(100, Number(value)));
  state.risk[key] = numericValue;
  const valueNode = document.getElementById("riskValue-" + key);
  const meter = document.getElementById("riskMeter-" + key);
  if (valueNode) valueNode.textContent = numericValue + "%";
  if (meter) meter.style.width = numericValue + "%";
  const values = Object.values(state.risk);
  const average = Math.round(values.reduce((sum, item) => sum + item, 0) / values.length);
  document.getElementById("riskAverage").textContent = average + "% promedio";
  document.getElementById("riskLevel").textContent = average < 20 ? "MODERADO / BAJO" : average < 40 ? "MODERADO" : "ELEVADO";
  const operationId = state.riskOperation;
  if (!operationId) return;
  window.clearTimeout(state.riskSaveTimers[key]);
  state.riskSaveTimers[key] = window.setTimeout(async () => {
    try {
      await apiRequest("/api/risks/", "POST", { operation: operationId, key, value: numericValue });
      const operation = operations.find((item) => item.id === operationId);
      if (operation) operation.risk[key] = numericValue;
    } catch (error) {
      toast(error.message, "error");
      const operation = operations.find((item) => item.id === operationId);
      if (operation && state.riskOperation === operationId) {
        state.risk[key] = operation.risk[key];
        renderView("risk");
      }
    }
  }, 350);
}

function openCustomsReview(reference = "") {
  const review = customsReviews.find((item) => item.reference === reference);
  const operationOptions = operations.map((operation) => '<option value="' + escapeHTML(operation.id) + '" ' +
    (review && review.operation === operation.id || !review && operations.length && operation.id === operations[0].id ? "selected" : "") + ">" +
    escapeHTML(operation.id + " · " + operation.client) + "</option>").join("");
  openModal(review ? "Revisión " + review.reference : "Registrar revisión", "CONTROL ADUANERO",
    '<form id="customsReviewForm" class="modal-form">' + (review ? '<p><strong>Referencia:</strong> ' + escapeHTML(review.reference) + "</p>" : "") +
    '<label>Embarque<select name="operation"><option value="">Sin asignar</option>' + operationOptions + '</select></label>' +
    '<div class="form-grid"><label>Tipo de declaración<input name="type" value="' + escapeHTML(review ? review.type : "Revisión documental") + '"></label>' +
    '<label>Aduana o recinto<input name="office" value="' + escapeHTML(review ? review.office : "") + '" placeholder="Por asignar"></label>' +
    (review ? '<label>Estado<select name="status">' + ["En revisión", "Retenido", "Liberado", "Pendiente"].map((status) =>
      '<option ' + (review.status === status ? "selected" : "") + ">" + status + "</option>").join("") + "</select></label>" : "") +
    '</div><label>Nota de seguimiento<textarea name="note" rows="3">' + escapeHTML(review ? review.note : "") +
    '</textarea></label><div class="notice notice-warn"><span>!</span><p>El registro sirve para seguimiento interno y no reemplaza la revisión de un agente aduanal.</p></div>' +
    '<button class="button button-primary modal-submit" type="submit">' + (review ? "Guardar cambios" : "Guardar revisión") + "</button></form>");
  document.getElementById("customsReviewForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = {
      operation: String(form.get("operation")),
      type: String(form.get("type")).trim(),
      office: String(form.get("office")).trim(),
      note: String(form.get("note")).trim()
    };
    if (review) {
      data.status = String(form.get("status"));
    }
    let result;
    try {
      result = review
        ? await apiRequest("/api/customs/" + encodeURIComponent(review.reference) + "/", "PUT", data)
        : await apiRequest("/api/customs/", "POST", data);
    } catch (error) {
      toast(error.message, "error");
      return;
    }
    const savedReview = result.customsReview;
    const index = customsReviews.findIndex((item) => item.reference === savedReview.reference);
    if (index === -1) customsReviews.unshift(savedReview);
    else customsReviews[index] = savedReview;
    closeModal();
    renderView("customs");
    toast(review ? "Revisión aduanera actualizada." : "Revisión aduanera guardada.");
  });
}

function renderAlertList(filter) {
  const list = filter === "all" ? alerts : alerts.filter((alert) => alert.open);
  document.getElementById("alertList").innerHTML = renderAlertItems(list);
}

function exportReport() {
  const rows = [
    ["Referencia", "Cliente", "Origen", "Destino", "Transporte", "Estado", "Avance"],
    ...operations.map((operation) => [operation.id, operation.client, operation.origin, operation.destination, operation.transport, operation.status, operation.progress + "%"])
  ];
  const csv = rows.map((row) => row.map((field) => '"' + String(field).replace(/"/g, '""') + '"').join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "reporte-infinity-operations.csv";
  link.click();
  URL.revokeObjectURL(url);
  toast("Reporte CSV generado.");
}

function requestDeviceLocation() {
  if (!navigator.geolocation) {
    toast("Este navegador no permite consultar la ubicación.", "error");
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    state.deviceLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    };
    showDeviceLocationOnMap();
    toast("Ubicación mostrada en el mapa. El proveedor de cartografía recibe solicitudes de mosaicos de esa zona.");
  }, (error) => {
    const reasons = {
      1: "Se denegó el permiso de ubicación.",
      2: "No se pudo determinar la ubicación.",
      3: "La consulta de ubicación tardó demasiado."
    };
    toast(reasons[error.code] || "No se pudo consultar la ubicación.", "error");
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
}

function requestInventoryDeviceLocation() {
  if (!navigator.geolocation) {
    toast("Este navegador no permite consultar la ubicación.", "error");
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    const latitude = document.getElementById("inventoryLatitude");
    const longitude = document.getElementById("inventoryLongitude");
    if (!latitude || !longitude) return;
    latitude.value = position.coords.latitude.toFixed(6);
    longitude.value = position.coords.longitude.toFixed(6);
    toast("Coordenadas agregadas al producto. Confirma la ubicación antes de guardar.");
  }, (error) => {
    const reasons = {
      1: "Se denegó el permiso de ubicación.",
      2: "No se pudo determinar la ubicación.",
      3: "La consulta de ubicación tardó demasiado."
    };
    toast(reasons[error.code] || "No se pudo consultar la ubicación.", "error");
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
}

document.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]");
  if (!action) return;
  const id = action.dataset.id;
  switch (action.dataset.action) {
    case "new-operation":
      openNewOperation();
      break;
    case "details":
      openOperationDetails(id);
      break;
    case "new-client":
      openNewClient();
      break;
    case "new-inventory-item":
      openNewInventoryItem();
      break;
    case "adjust-inventory":
      openAdjustInventory(Number(action.dataset.id));
      break;
    case "inventory-use-location":
      requestInventoryDeviceLocation();
      break;
    case "fit-inventory-map":
      fitInventoryMap(true);
      break;
    case "client-info":
      showClient(action.dataset.name);
      break;
    case "open-doc-mode":
      state.documentMode = action.dataset.mode;
      navigate("documents");
      break;
    case "resolve-alert": {
      const alert = alerts.find((item) => item.id === id);
      if (alert) {
        try {
          const result = await apiRequest("/api/alerts/" + encodeURIComponent(id) + "/toggle/", "POST", {});
          Object.assign(alert, result.alert);
          renderView("alerts");
          toast(alert.open ? "Alerta reabierta." : "Alerta marcada como revisada.");
        } catch (error) {
          toast(error.message, "error");
        }
      }
      break;
    }
    case "mark-all-alerts":
      try {
        await apiRequest("/api/alerts/resolve-all/", "POST", {});
        alerts.forEach((alert) => { alert.open = false; alert.time = "Hace un momento"; });
        renderView("alerts");
        toast("Alertas abiertas marcadas como revisadas.");
      } catch (error) {
        toast(error.message, "error");
      }
      break;
    case "advance-operation": {
      const operation = operations.find((item) => item.id === id);
      if (operation) {
        try {
          const result = await apiRequest("/api/operations/" + encodeURIComponent(id) + "/advance/", "POST", {});
          updateOperationCache(result.operation);
          openOperationDetails(id);
          toast(result.operation.progress === 100 ? "La simulación llegó al destino." : "Avance de demostración guardado.");
        } catch (error) {
          toast(error.message, "error");
        }
      }
      break;
    }
    case "invoice": {
      const operation = operations.find((item) => item.id === id);
      if (operation) openInvoice(operation);
      break;
    }
    case "print-invoice":
      window.print();
      break;
    case "use-current-location":
      requestDeviceLocationForForm();
      break;
    case "geolocate":
      requestDeviceLocation();
      break;
    case "fit-map":
      fitMapToOperations();
      break;
    case "map-filter": {
      pageContent.querySelectorAll("[data-map-filter]").forEach((button) => button.classList.toggle("active", button === action));
      state.mapFilter = action.dataset.mapFilter;
      operationMapMarkers.forEach((entry) => {
        const visible = state.mapFilter === "all" || entry.operation.status === state.mapFilter;
        setMapMarkerVisible(operationsMap, entry.marker, visible);
      });
      const visibleEntry = operationMapMarkers.find((entry) => state.mapFilter === "all" || entry.operation.status === state.mapFilter);
      const routeSelect = document.getElementById("routeSelect");
      if (visibleEntry && routeSelect) {
        routeSelect.value = visibleEntry.operation.id;
        document.getElementById("routeOverview").innerHTML = renderRouteOverview(visibleEntry.operation);
      }
      fitMapToOperations();
      break;
    }
    case "customs-note":
      openCustomsReview();
      break;
    case "customs-detail":
      openCustomsReview(action.dataset.ref);
      break;
    case "export-report":
      exportReport();
      break;
  }
});

pageContent.addEventListener("input", (event) => {
  if (event.target.id === "operationSearch") {
    state.operationQuery = event.target.value.trim();
    const filtered = operations.filter((operation) => [operation.id, operation.client, operation.origin, operation.destination, operation.transport]
      .some((value) => value.toLowerCase().includes(state.operationQuery.toLowerCase())));
    document.getElementById("operationTable").innerHTML = operationTable(filtered);
  }
  if (event.target.id === "inventorySearch") {
    state.inventoryQuery = event.target.value.trim();
    document.getElementById("inventoryTableBody").innerHTML = renderInventoryRows(getFilteredInventory());
  }
  if (event.target.matches("[data-risk]")) updateRisk(event.target.dataset.risk, event.target.value);
});

pageContent.addEventListener("change", async (event) => {
  if (event.target.id === "documentOperation") {
    state.documentOperation = event.target.value;
    const operation = operations.find((item) => item.id === state.documentOperation);
    if (operation && transportDocuments[operation.transport]) state.documentMode = operation.transport;
    renderView("documents");
  }
  if (event.target.id === "documentMode") {
    state.documentMode = event.target.value;
    renderView("documents");
  }
  if (event.target.id === "riskOperation") {
    state.riskOperation = event.target.value;
    renderView("risk");
  }
  if (event.target.id === "inventoryMapFilter" || event.target.id === "inventoryCategoryFilter") {
    updateInventoryCategory(event.target.value);
  }
  if (event.target.id === "statusFilter") {
    const filtered = operations.filter((operation) => (!event.target.value || operation.status === event.target.value) &&
      [operation.id, operation.client, operation.origin, operation.destination, operation.transport].some((value) => value.toLowerCase().includes(state.operationQuery.toLowerCase())));
    document.getElementById("operationTable").innerHTML = operationTable(filtered);
  }
  if (event.target.id === "alertFilter") renderAlertList(event.target.value);
  if (event.target.id === "routeSelect") {
    const operation = operations.find((item) => item.id === event.target.value);
    if (operation) {
      document.getElementById("routeOverview").innerHTML = renderRouteOverview(operation);
      focusMapOperation(operation.id);
    }
  }
  if (event.target.matches("[data-doc-index]")) {
    const index = Number(event.target.dataset.docIndex);
    const operationId = state.documentOperation;
    const mode = state.documentMode;
    const checkbox = event.target;
    const checked = checkbox.checked;
    const operationDocuments = transportDocuments[mode] || [];
    if (!operationId || !operationDocuments[index]) {
      checkbox.checked = false;
      toast("Registra o selecciona un embarque antes de revisar documentos.", "error");
      return;
    }
    checkbox.disabled = true;
    try {
      await apiRequest("/api/documents/", "POST", {
        operation: operationId,
        mode,
        index,
        name: operationDocuments[index][0],
        checked
      });
      if (!state.checkedDocuments[operationId]) state.checkedDocuments[operationId] = {};
      if (!state.checkedDocuments[operationId][mode]) state.checkedDocuments[operationId][mode] = [];
      const selected = new Set(state.checkedDocuments[operationId][mode]);
      if (checked) selected.add(index);
      else selected.delete(index);
      state.checkedDocuments[operationId][mode] = [...selected];
      const total = operationDocuments.length;
      document.getElementById("docsCount").textContent = selected.size + " / " + total;
      document.getElementById("docsProgress").style.width = selected.size / total * 100 + "%";
      document.getElementById("docsCompletion").innerHTML = statusPill(selected.size === total ? "Completo" : "En revisión");
    } catch (error) {
      checkbox.checked = !checked;
      toast(error.message, "error");
    } finally {
      checkbox.disabled = false;
    }
  }
  if (event.target.id === "reportPeriod") {
    state.reportMonths = Number(event.target.value);
    renderView("reports");
  }
});

function requestDeviceLocationForForm() {
  if (!navigator.geolocation) {
    toast("Este navegador no permite consultar la ubicación.", "error");
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    const field = document.getElementById("newOperationAddress");
    if (field) {
      state.newOperationLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
      field.value = "Coordenadas del dispositivo: " + position.coords.latitude.toFixed(5) + ", " + position.coords.longitude.toFixed(5);
      toast("Coordenadas agregadas como referencia de entrega. El proveedor del mapa recibirá mosaicos de esa zona al mostrar la operación.");
    }
  }, (error) => {
    const reasons = { 1: "Se denegó el permiso de ubicación.", 2: "No se pudo determinar la ubicación.", 3: "La consulta tardó demasiado." };
    toast(reasons[error.code] || "No se pudo consultar la ubicación.", "error");
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
}

renderView("dashboard");
