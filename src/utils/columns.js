import { fold } from './normalize.js'

// Alias de cabeceras (ya sin tildes/mayúsculas), por orden de prioridad.
export const FIELDS = [
  { key: 'date', label: 'Fecha', required: true,
    aliases: ['fecha', 'fecha servicio', 'fecha de servicio', 'fecha operacion', 'fecha de operacion', 'fecha mudanza', 'fec', 'date', 'dia'] },
  { key: 'amount', label: 'Importe', required: true,
    aliases: ['importe', 'importe total', 'monto', 'monto total', 'total', 'total s/', 'total soles', 'precio', 'valor', 'venta', 'ventas', 'facturacion', 'tarifa', 'ingreso', 'amount'] },
  { key: 'ref', label: 'N.º operación', required: false,
    aliases: ['id', 'n operacion', 'nro operacion', 'numero operacion', 'n servicio', 'nro servicio', 'numero servicio', 'n documento', 'documento', 'comprobante', 'ticket', 'folio', 'albaran', 'orden', 'codigo', 'referencia', 'ref', 'numero', 'nro', 'n'] },
  { key: 'truck', label: 'Camión', required: false,
    aliases: ['camion', 'vehiculo', 'placa', 'unidad', 'movil', 'truck', 'cam'] },
  { key: 'client', label: 'Cliente', required: false,
    aliases: ['cliente', 'razon social', 'nombre cliente', 'nombre', 'customer', 'destinatario', 'contacto'] },
]

const headerKey = (cell) => fold(cell).replace(/[^a-z0-9/ ]/g, ' ').replace(/\s+/g, ' ').trim()

/** Devuelve { fieldKey: columnIndex | null } con la mejor columna para cada campo. */
export function detectMapping(headerRow) {
  const headers = headerRow.map(headerKey)
  const used = new Set()
  const mapping = Object.fromEntries(FIELDS.map((f) => [f.key, null]))

  // 1.ª pasada: coincidencia exacta; 2.ª: la cabecera contiene el alias (alias de 4+ letras)
  for (const exact of [true, false]) {
    for (const field of FIELDS) {
      if (mapping[field.key] !== null) continue
      for (const alias of field.aliases) {
        if (!exact && alias.length < 4) continue
        const idx = headers.findIndex((h, i) => !used.has(i) && h && (exact ? h === alias : h.includes(alias)))
        if (idx >= 0) {
          mapping[field.key] = idx
          used.add(idx)
          break
        }
      }
    }
  }
  return mapping
}

/** Busca la fila de cabecera entre las primeras filas (hay exportaciones con títulos encima). */
export function findHeaderRow(matrix, scan = 20) {
  let best = { index: 0, score: -1 }
  for (let i = 0; i < Math.min(matrix.length, scan); i++) {
    const row = matrix[i] || []
    if (!row.some((c) => String(c ?? '').trim())) continue
    const mapping = detectMapping(row)
    const score = FIELDS.filter((f) => mapping[f.key] !== null).length + (mapping.date !== null && mapping.amount !== null ? 10 : 0)
    if (score > best.score) best = { index: i, score }
  }
  return best.index
}
