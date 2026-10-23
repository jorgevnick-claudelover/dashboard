// Genera archivos de ejemplo "sucios" (mayúsculas, abreviaturas, filas vacías, decimales con coma…)
// y una hoja de control con los totales exactos esperados. Datos inventados, sin relación con clientes reales.
import { mkdirSync, writeFileSync } from 'node:fs'
import * as XLSX from 'xlsx'

const OUT = new URL('../sample-data/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

let seed = 20261005
const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296)
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]

const CLIENTS = [
  'HNOS. QUISPE E HIJOS S.A.C.', 'CIA MINERA DEL NORTE SAC', 'SR. JUAN PEREZ', 'ING. LUIS RAMOS', 'DISTRIB. PIURANA SRL',
  'MARIA ELENA TORRES', 'COOP. AGRARIA SECHURA', 'DRA. ROSA CHAVEZ', 'INV. LAS PALMERAS EIRL', 'CARLOS DE LA CRUZ', 'CONST. TALLAN SAC', 'ANA LUCIA VEGA',
]
const TRUCKS = ['CAMION 1', 'CAM 2', 'camion3', 'ABC-123', 'xyz 456', 'CAMIÓN 6']
const ISO = (d) => d.toISOString().slice(0, 10)
const addDays = (iso, n) => ISO(new Date(Date.parse(iso) + n * 86400000))
const dow = (iso) => (new Date(Date.parse(iso)).getUTCDay() + 6) % 7

let counter = 0
function week(mondayIso) {
  const rows = []
  for (let i = 0; i < 7; i++) {
    const date = addDays(mondayIso, i)
    const n = i < 5 ? 6 + Math.floor(rnd() * 5) : i === 5 ? 3 + Math.floor(rnd() * 3) : Math.floor(rnd() * 2)
    for (let k = 0; k < n; k++) {
      counter++
      // Céntimos "incómodos" a propósito (0.10, 0.35, 0.07…) para delatar errores de coma flotante
      const cents = (150 + Math.floor(rnd() * 1650)) * 100 + pick([10, 35, 7, 20, 55, 95, 0, 15])
      rows.push({ date, ref: `MT-26-${String(counter).padStart(4, '0')}`, client: pick(CLIENTS), truck: pick(TRUCKS), cents })
    }
  }
  return rows
}
const total = (rows) => rows.reduce((s, r) => s + r.cents, 0)
const dmy = (iso) => iso.split('-').reverse().join('/')
const fmtDot = (c) => `${Math.trunc(c / 100)}.${String(c % 100).padStart(2, '0')}`
const fmtEs = (c) => `${String(Math.trunc(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${String(c % 100).padStart(2, '0')}`
const fmtSol = (c) => `S/ ${String(Math.trunc(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${String(c % 100).padStart(2, '0')}`

const w0 = week('2026-09-28')
const w1 = week('2026-10-05')
const w2 = week('2026-10-12')

// 1) Semana 28 sep–4 oct: CSV con comas, importes "S/ 1,234.50", fechas dd/mm/yyyy
{
  const lines = ['Fecha,N° Operación,Cliente,Camión,Importe']
  for (const r of w0) lines.push(`${dmy(r.date)},${r.ref},"${r.client}",${r.truck},"${fmtSol(r.cents)}"`)
  writeFileSync(OUT + 'semana-2026-09-28.csv', lines.join('\n') + '\n')
}
// 2) Semana 5–11 oct: CSV con punto y coma, decimales con coma, Windows-1252, filas vacías al final
{
  const lines = ['FECHA;NRO OPERACION;CLIENTE;VEHICULO;IMPORTE TOTAL']
  for (const r of w1) lines.push(`${dmy(r.date)};${r.ref};${r.client};${r.truck};${fmtEs(r.cents)}`)
  lines.push(';;;;', ';;;;', ';;;;')
  writeFileSync(OUT + 'semana-2026-10-05.csv', Buffer.from(lines.join('\r\n') + '\r\n', 'latin1'))
}
// 3) Semana 12–18 oct: Excel con título encima, fechas y números reales, fila TOTAL y filas vacías
{
  const aoa = [['MUDANZAS TREBOL - EXPORTACION SEMANAL'], ['Del 12/10/2026 al 18/10/2026'], [], ['Fecha', 'Documento', 'Razón social', 'Placa', 'Monto']]
  const serial = (iso) => Math.round(Date.parse(iso) / 86400000) + 25569
  for (const r of w2) aoa.push([serial(r.date), r.ref, r.client, r.truck, r.cents / 100])
  aoa.push(['TOTAL', '', '', '', w2.reduce((s, r) => s + r.cents, 0) / 100], [], [], [])
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Export')
  XLSX.writeFile(wb, OUT + 'semana-2026-10-12.xlsx')
}
// Hoja de control del cliente: totales exactos esperados (céntimos enteros → sin errores de redondeo)
const control = [
  ['Semana', 'Archivo', 'Operaciones', 'Total esperado'],
  ['2026-09-28', 'semana-2026-09-28.csv', w0.length, fmtDot(total(w0))],
  ['2026-10-05', 'semana-2026-10-05.csv', w1.length, fmtDot(total(w1))],
  ['2026-10-12', 'semana-2026-10-12.xlsx', w2.length, fmtDot(total(w2))],
]
writeFileSync(OUT + 'hoja-de-control.csv', control.map((r) => r.join(',')).join('\n') + '\n')
writeFileSync(OUT + 'control.json', JSON.stringify({ w0: { n: w0.length, cents: total(w0) }, w1: { n: w1.length, cents: total(w1) }, w2: { n: w2.length, cents: total(w2) } }, null, 2))
console.log(control.map((r) => r.join('\t')).join('\n'))
