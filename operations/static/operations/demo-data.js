function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

window.INFINITY_SEED_DATA = {
  operations: [
    {
      id: "HB-24025", client: "Comercializadora del Centro", origin: "Querétaro, México",
      destination: "Toluca, México", transport: "Ferroviario", status: "En tránsito",
      progress: 55, eta: "6 h", updated: "Hace 2 h", item: "Equipo de cocina",
      recipient: "Ana López", address: "Toluca, Estado de México", quantity: 5, price: 3200,
      originCoords: [20.59, -100.39], coords: [19.29, -99.65],
      risk: { delay: 7, damage: 14, customs: 13, weather: 31, loss: 38 }, createdAt: daysAgo(2)
    },
    {
      id: "HB-24014", client: "Pacific Components", origin: "Frankfurt, Alemania",
      destination: "Ciudad de México, México", transport: "Aéreo", status: "En destino",
      progress: 100, eta: "Entregado", updated: "Hace 1 día", item: "Sensores industriales",
      recipient: "Jorge Ruiz", address: "Ciudad de México", quantity: 20, price: 1450,
      originCoords: [50.11, 8.68], coords: [19.43, -99.13],
      risk: { delay: 7, damage: 14, customs: 13, weather: 31, loss: 38 }, createdAt: daysAgo(4)
    },
    {
      id: "HB-24009", client: "Industrias del Bajío", origin: "Veracruz, México",
      destination: "Puebla, México", transport: "Terrestre", status: "Incidencia",
      progress: 46, eta: "En revisión", updated: "Hace 3 h", item: "Componentes electrónicos",
      recipient: "Lucía Torres", address: "Puebla, Puebla", quantity: 8, price: 2150,
      originCoords: [19.17, -96.13], coords: [19.04, -98.2],
      risk: { delay: 7, damage: 14, customs: 13, weather: 31, loss: 38 }, createdAt: daysAgo(6)
    },
    {
      id: "HB-24021", client: "North Trade Supplies", origin: "Laredo, Estados Unidos",
      destination: "Monterrey, México", transport: "Terrestre", status: "En tránsito",
      progress: 82, eta: "3 h", updated: "Hace 5 h", item: "Refacciones de maquinaria",
      recipient: "Carlos Méndez", address: "Monterrey, Nuevo León", quantity: 12, price: 980,
      originCoords: [27.51, -99.51], coords: [25.68, -100.31],
      risk: { delay: 7, damage: 14, customs: 13, weather: 31, loss: 38 }, createdAt: daysAgo(9)
    },
    {
      id: "HB-24018", client: "Comercializadora del Centro", origin: "Shanghai, China",
      destination: "Manzanillo, México", transport: "Marítimo", status: "En tránsito",
      progress: 68, eta: "12 h", updated: "Hace 1 día", item: "Licuadoras industriales",
      recipient: "Ana López", address: "Manzanillo, Colima", quantity: 3, price: 4250,
      originCoords: [31.23, 121.47], coords: [19.05, -104.32],
      risk: { delay: 7, damage: 14, customs: 13, weather: 31, loss: 38 }, createdAt: daysAgo(12)
    }
  ],
  clients: [
    { name: "Comercializadora del Centro", country: "México", contact: "Ana López", email: "", operations: 2, status: "Activo" },
    { name: "Industrias del Bajío", country: "México", contact: "Lucía Torres", email: "", operations: 1, status: "Activo" },
    { name: "North Trade Supplies", country: "Estados Unidos", contact: "Carlos Méndez", email: "", operations: 1, status: "Activo" },
    { name: "Pacific Components", country: "Alemania", contact: "Jorge Ruiz", email: "", operations: 1, status: "Revisión" }
  ],
  alerts: [
    { id: "AL-036", title: "Documento complementario pendiente", operation: "HB-24018", severity: "Media", area: "Documentación", time: "Hace 1 día", open: true },
    { id: "AL-037", title: "Confirmar actualización de ruta", operation: "HB-24021", severity: "Media", area: "Transporte", time: "Hace 2 días", open: true },
    { id: "AL-038", title: "Demora en inspección documental", operation: "HB-24009", severity: "Alta", area: "Aduana", time: "Hace 3 días", open: true }
  ],
  customs: [
    { reference: "AD-2026-0039", operation: "HB-24025", type: "Tránsito ferroviario", office: "Toluca", status: "Pendiente", updated: "Hace 1 día", note: "" },
    { reference: "AD-2026-0040", operation: "HB-24014", type: "Importación aérea", office: "AICM", status: "Liberado", updated: "Hace 2 días", note: "" },
    { reference: "AD-2026-0041", operation: "HB-24009", type: "Importación terrestre", office: "Puebla", status: "Retenido", updated: "Hace 3 días", note: "" },
    { reference: "AD-2026-0042", operation: "HB-24018", type: "Importación marítima", office: "Manzanillo", status: "En revisión", updated: "Hace 4 días", note: "" }
  ],
  inventory: [],
  checkedDocuments: {}
};
