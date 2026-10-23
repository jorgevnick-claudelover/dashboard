import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contentHash, planImport } from './dedupe.js'
import { parseDate } from './dates.js'
import { buildDashboard, summarize } from './metrics.js'
import { averageCents, formatMoney, formatPct, pctChange, toCents } from './money.js'
import { normalizeName, normalizeTruck } from './normalize.js'
import { buildRecords, csvToMatrix, inspectMatrix, missingFields, xlsxToMatrix } from './parseFile.js'

const sample = (name) => readFileSync(new URL(`../../sample-data/${name}`, import.meta.url))
const control = JSON.parse(sample('control.json').toString())

function loadSample(name) {
  const buf = sample(name)
  let matrix
  if (name.endsWith('.xlsx')) {
    matrix = xlsxToMatrix(new Uint8Array(buf).buffer).matrix
  } else {
    let text
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf) } catch { text = new TextDecoder('windows-1252').decode(buf) }
    matrix = csvToMatrix(text.replace(/^﻿/, ''))
  }
  const draft = inspectMatrix(matrix, { fileName: name })
  return { draft, built: buildRecords(matrix, draft.headerRow, draft.mapping) }
}

describe('dinero exacto', () => {
  it('convierte formatos peruanos y europeos a céntimos', () => {
    expect(toCents(1234.5)).toBe(123450)
    expect(toCents('S/ 1,234.50')).toBe(123450)
    expect(toCents('1.234,50')).toBe(123450)
    expect(toCents('1,234')).toBe(123400)
    expect(toCents('12,5')).toBe(1250)
    expect(toCents('(100.00)')).toBe(-10000)
    expect(toCents('')).toBeNull()
    expect(toCents('abc')).toBeNull()
  })
  it('no arrastra error de coma flotante', () => {
    expect(0.1 + 0.2).not.toBe(0.3) // el problema que evitamos
    expect(toCents(0.1) + toCents(0.2)).toBe(30)
    expect(toCents(1.005)).toBe(101) // half up sobre el decimal escrito, no sobre el binario
    expect(toCents(19.99) * 3).toBe(5997)
  })
  it('la media y la variación redondean half up a 2 decimales', () => {
    expect(averageCents(1001, 2)).toBe(501)
    expect(averageCents(1000, 3)).toBe(333)
    expect(averageCents(0, 0)).toBeNull()
    expect(pctChange(110, 100)).toBe(10)
    expect(pctChange(1, 3)).toBe(-66.67)
    expect(pctChange(4, 3)).toBe(33.33)
    expect(pctChange(5, 0)).toBeNull()
  })
  it('formatea sin pasar por float', () => {
    expect(formatMoney(123456789)).toBe('S/ 1,234,567.89')
    expect(formatMoney(-5)).toBe('−S/ 0.05')
    expect(formatMoney(5, { sign: true })).toBe('+S/ 0.05')
    expect(formatPct(-12.5)).toBe('−12.50 %')
  })
})

describe('fechas y nombres', () => {
  it('interpreta dd/mm/yyyy, ISO y serial de Excel', () => {
    expect(parseDate('05/10/2026')).toBe('2026-10-05')
    expect(parseDate('2026-10-05')).toBe('2026-10-05')
    expect(parseDate(46300)).toBe('2026-10-05')
    expect(parseDate('5 de octubre de 2026')).toBe('2026-10-05')
    expect(parseDate('31/02/2026')).toBeNull()
    expect(parseDate('TOTAL')).toBeNull()
  })
  it('normaliza mayúsculas y abreviaturas', () => {
    expect(normalizeName('HNOS. QUISPE E HIJOS S.A.C.')).toBe('Hermanos Quispe e Hijos S.A.C.')
    expect(normalizeName('CIA MINERA DEL NORTE SAC')).toBe('Compañía Minera del Norte S.A.C.')
    expect(normalizeName('  sr.  juan   perez ')).toBe('Señor Juan Perez')
    expect(normalizeTruck('CAM 2')).toBe('Camión 2')
    expect(normalizeTruck('camion3')).toBe('Camión 3')
    expect(normalizeTruck('abc123')).toBe('ABC-123')
    expect(normalizeTruck('xyz 456')).toBe('XYZ-456')
  })
})

describe('archivos de ejemplo vs. hoja de control', () => {
  it('CSV con comas y "S/ 1,234.50"', () => {
    const { built } = loadSample('semana-2026-09-28.csv')
    expect(built.records).toHaveLength(control.w0.n)
    expect(summarize(built.records).totalCents).toBe(control.w0.cents)
  })
  it('CSV latin1, punto y coma, decimales con coma y filas vacías al final', () => {
    const { draft, built } = loadSample('semana-2026-10-05.csv')
    expect(missingFields(draft.mapping)).toHaveLength(0)
    expect(built.emptyRows).toBe(3)
    expect(built.discarded).toHaveLength(0)
    expect(built.records).toHaveLength(control.w1.n)
    expect(summarize(built.records).totalCents).toBe(control.w1.cents)
    expect(built.records.some((r) => r.truck === 'Camión 6')).toBe(true) // la tilde sobrevive a la decodificación
  })
  it('Excel con título encima, fila TOTAL descartada y filas vacías', () => {
    const { draft, built } = loadSample('semana-2026-10-12.xlsx')
    expect(draft.headerRow).toBe(3)
    expect(built.discarded).toHaveLength(1)
    expect(built.discarded[0].reason).toBe('Sin fecha válida')
    expect(built.records).toHaveLength(control.w2.n)
    expect(summarize(built.records).totalCents).toBe(control.w2.cents)
  })
})

describe('antiduplicados', () => {
  it('detecta el mismo archivo aunque cambie el formato o el orden', async () => {
    const { built } = loadSample('semana-2026-10-05.csv')
    const hash = await contentHash(built.records)
    const first = planImport(built.records, hash, [], [])
    expect(first.fresh).toHaveLength(built.records.length)
    expect(first.fileAlreadyLoaded).toBe(false)

    const stored = built.records.map((r) => ({ ...r, fileId: 'a' }))
    const shuffled = [...built.records].reverse()
    const again = planImport(shuffled, await contentHash(shuffled), stored, [{ id: 'a', hash, name: 'x.csv' }])
    expect(again.fileAlreadyLoaded).toBe(true)
    expect(again.fresh).toHaveLength(0)
  })
  it('un archivo solapado solo aporta las filas nuevas', async () => {
    const { built } = loadSample('semana-2026-10-05.csv')
    const stored = built.records.slice(0, 10).map((r) => ({ ...r, fileId: 'a' }))
    const plan = planImport(built.records, await contentHash(built.records), stored, [{ id: 'a', hash: 'otro', name: 'x.csv' }])
    expect(plan.duplicates).toHaveLength(10)
    expect(plan.fresh).toHaveLength(built.records.length - 10)
    expect(plan.fileAlreadyLoaded).toBe(false)
  })
  it('conserva operaciones idénticas repetidas dentro de un mismo archivo', () => {
    const matrix = [['Fecha', 'Importe'], ['01/10/2026', '100'], ['01/10/2026', '100']]
    const d = inspectMatrix(matrix)
    const { records } = buildRecords(matrix, d.headerRow, d.mapping)
    expect(records).toHaveLength(2)
    expect(new Set(records.map((r) => r.key)).size).toBe(2)
  })
})

describe('panel: comparativa y acumulado', () => {
  const all = ['semana-2026-09-28.csv', 'semana-2026-10-05.csv', 'semana-2026-10-12.xlsx'].flatMap((n) => loadSample(n).built.records)

  it('por defecto compara la última semana con la inmediatamente anterior', () => {
    const dash = buildDashboard(all, { mode: 'week', week: null })
    expect(dash.period.from).toBe('2026-10-12')
    expect(dash.period.to).toBe('2026-10-18')
    expect(dash.period.prev.from).toBe('2026-10-05')
    expect(dash.current.totalCents).toBe(control.w2.cents)
    expect(dash.previous.totalCents).toBe(control.w1.cents)
    expect(dash.comparison.total.diff).toBe(control.w2.cents - control.w1.cents)
    expect(dash.comparison.total.pct).toBe(pctChange(control.w2.cents, control.w1.cents))
    expect(dash.comparison.total.diff).toBeLessThan(0)
  })
  it('mejor y peor día salen de totales diarios', () => {
    const dash = buildDashboard(all, { mode: 'week', week: null })
    const totals = dash.current.days.map((d) => d.totalCents)
    expect(dash.current.best.totalCents).toBe(Math.max(...totals))
    expect(dash.current.worst.totalCents).toBe(Math.min(...totals))
  })
  it('MTD: mes del último dato, hasta ese día', () => {
    const dash = buildDashboard(all, { mode: 'week', week: null })
    const oct = all.filter((r) => r.date.startsWith('2026-10'))
    expect(dash.mtd.period.from).toBe('2026-10-01')
    expect(dash.mtd.period.to).toBe(dash.lastLoadedDate)
    expect(dash.mtd.summary.totalCents).toBe(oct.reduce((s, r) => s + r.cents, 0))
  })
  it('semana sin datos previos no inventa variación', () => {
    const only = all.filter((r) => r.date >= '2026-10-12')
    const dash = buildDashboard(only, { mode: 'week', week: null })
    expect(dash.comparison.hasPrevious).toBe(false)
  })
})
