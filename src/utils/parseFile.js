import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { detectMapping, findHeaderRow, FIELDS } from './columns.js'
import { parseDate } from './dates.js'
import { toCents } from './money.js'
import { fold, normalizeName, normalizeRef, normalizeTruck } from './normalize.js'

const isBlank = (cell) => cell === null || cell === undefined || String(cell).trim() === ''
const isBlankRow = (row) => !row || row.every(isBlank)

function decodeText(buffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^﻿/, '')
  } catch {
    // Exportaciones antiguas en Windows-1252: "CAMIÓN" saldría como "CAMI�N" en UTF-8
    return new TextDecoder('windows-1252').decode(buffer)
  }
}

/** Convierte el texto de un CSV en una matriz de filas (delimitador autodetectado). */
export function csvToMatrix(text) {
  const result = Papa.parse(text, { delimitersToGuess: [',', ';', '\t', '|'], skipEmptyLines: false })
  const rows = result.data
  // El salto de línea final del archivo no es una fila vacía real
  if (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop()
  return rows
}

/** Primera hoja con contenido de un Excel → matriz. Las fechas llegan como serial y se convierten luego. */
export function xlsxToMatrix(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  for (const name of workbook.SheetNames) {
    const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, raw: true, defval: '', blankrows: true })
    if (matrix.some((row) => !isBlankRow(row))) return { matrix, sheetName: name }
  }
  return { matrix: [], sheetName: workbook.SheetNames[0] }
}

/** Lee un File (CSV, TXT, XLS, XLSX) y propone cabecera y mapeo de columnas. */
export async function inspectFile(file) {
  const buffer = await file.arrayBuffer()
  const isExcel = /\.(xlsx|xlsm|xls)$/i.test(file.name)
  let matrix
  let sheetName = null
  if (isExcel) {
    ;({ matrix, sheetName } = xlsxToMatrix(buffer))
  } else {
    matrix = csvToMatrix(decodeText(buffer))
  }
  return inspectMatrix(matrix, { fileName: file.name, size: file.size, sheetName })
}

export function inspectMatrix(matrix, meta = {}) {
  const headerRow = findHeaderRow(matrix)
  const headers = (matrix[headerRow] || []).map((h) => String(h ?? '').trim())
  return { ...meta, matrix, headerRow, headers, mapping: detectMapping(headers) }
}

/** ¿Faltan columnas obligatorias en el mapeo? */
export function missingFields(mapping) {
  return FIELDS.filter((f) => f.required && (mapping[f.key] === null || mapping[f.key] === undefined))
}

const cell = (row, idx) => (idx === null || idx === undefined ? '' : row[idx] ?? '')

/**
 * Filas → registros normalizados.
 * - Elimina filas vacías (incluidas las del final del archivo).
 * - Descarta, y lo explica, filas sin fecha o importe válidos (p. ej. la línea "TOTAL").
 * - Normaliza nombres de cliente y camión.
 * - Genera una clave por registro; si un registro idéntico aparece varias veces en el mismo
 *   archivo se numera (#1, #2…) para no perder operaciones legítimamente repetidas.
 */
export function buildRecords(matrix, headerRow, mapping) {
  const body = matrix.slice(headerRow + 1)
  const records = []
  const discarded = []
  let emptyRows = 0
  const seen = new Map()

  body.forEach((row, i) => {
    const sheetRow = headerRow + 2 + i
    if (isBlankRow(row)) {
      emptyRows++
      return
    }
    const date = parseDate(cell(row, mapping.date))
    const cents = toCents(cell(row, mapping.amount))
    if (!date) {
      discarded.push({ row: sheetRow, reason: 'Sin fecha válida', preview: previewRow(row) })
      return
    }
    if (cents === null) {
      discarded.push({ row: sheetRow, reason: 'Importe vacío o no válido', preview: previewRow(row) })
      return
    }
    const ref = normalizeRef(cell(row, mapping.ref))
    const client = normalizeName(cell(row, mapping.client))
    const truck = normalizeTruck(cell(row, mapping.truck))
    const base = [date, fold(ref), fold(client), fold(truck), cents].join('|')
    const occurrence = (seen.get(base) || 0) + 1
    seen.set(base, occurrence)
    records.push({ key: `${base}#${occurrence}`, date, ref, client, truck, cents })
  })

  // Las filas vacías al final del archivo no cuentan como "filas leídas"
  return { records, discarded, emptyRows, rowsRead: body.length }
}

function previewRow(row) {
  return row.map((c) => String(c ?? '').trim()).filter(Boolean).join(' · ').slice(0, 90)
}
