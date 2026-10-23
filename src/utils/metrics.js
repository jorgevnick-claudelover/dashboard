import { addDays, addMonths, diffDays, formatRange, mondayOf, monthEnd, monthKey, monthLabel, monthStart } from './dates.js'
import { averageCents, pctChange } from './money.js'

export const inRange = (records, from, to) => records.filter((r) => r.date >= from && r.date <= to)

/** Volumen total, nº de operaciones, importe medio y mejor/peor día de un conjunto de registros. */
export function summarize(records) {
  const byDay = new Map()
  let totalCents = 0
  for (const r of records) {
    totalCents += r.cents
    const day = byDay.get(r.date) || { date: r.date, totalCents: 0, count: 0 }
    day.totalCents += r.cents
    day.count += 1
    byDay.set(r.date, day)
  }
  const days = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date))
  // En empate gana el primer día (orden cronológico estable)
  let best = null
  let worst = null
  for (const d of days) {
    if (!best || d.totalCents > best.totalCents) best = d
    if (!worst || d.totalCents < worst.totalCents) worst = d
  }
  return {
    count: records.length,
    totalCents,
    avgCents: averageCents(totalCents, records.length),
    days,
    best,
    worst,
    firstDate: days[0]?.date ?? null,
    lastDate: days[days.length - 1]?.date ?? null,
  }
}

/** Diferencia exacta (en céntimos o unidades) y % de variación respecto a la base. */
export function variation(current, previous) {
  if (current === null || previous === null || current === undefined || previous === undefined) return null
  return { diff: current - previous, pct: pctChange(current, previous) }
}

export function compareSummaries(cur, prev) {
  return {
    total: variation(cur.totalCents, prev.totalCents),
    count: variation(cur.count, prev.count),
    avg: variation(cur.avgCents, prev.avgCents),
    hasPrevious: prev.count > 0,
  }
}

export function availableWeeks(records) {
  return [...new Set(records.map((r) => mondayOf(r.date)))].sort().reverse()
}
export function availableMonths(records) {
  return [...new Set(records.map((r) => monthKey(r.date)))].sort().reverse()
}
export function lastDate(records) {
  return records.reduce((max, r) => (r.date > max ? r.date : max), '')
}

/**
 * Resuelve el periodo seleccionado y su periodo de comparación.
 *  - semana: lunes–domingo vs. la semana natural inmediatamente anterior.
 *  - mes: del día 1 al último día con datos (si es el mes en curso) vs. los mismos días del mes anterior.
 *  - rango: vs. el rango anterior de la misma duración.
 */
export function resolvePeriod(selection, records) {
  const last = lastDate(records)
  if (!last) return null
  const mode = selection.mode
  if (mode === 'month') {
    const key = selection.month || monthKey(last)
    const start = monthStart(key)
    const fullEnd = monthEnd(key)
    const end = last >= start && last < fullEnd ? last : fullEnd
    const prevKey = addMonths(key, -1)
    const prevStart = monthStart(prevKey)
    const prevEnd = addDays(prevStart, Math.min(diffDays(end, start), diffDays(monthEnd(prevKey), prevStart)))
    return {
      mode, from: start, to: end, label: monthLabel(key), kind: 'mes', prevPhrase: 'el mes anterior',
      prev: { from: prevStart, to: prevEnd, label: `${monthLabel(prevKey)} (${formatRange(prevStart, prevEnd)})` },
    }
  }
  if (mode === 'range' && selection.from && selection.to && selection.from <= selection.to) {
    const span = diffDays(selection.to, selection.from)
    const prevTo = addDays(selection.from, -1)
    const prevFrom = addDays(prevTo, -span)
    return {
      mode, from: selection.from, to: selection.to, label: formatRange(selection.from, selection.to), kind: 'rango', prevPhrase: 'el rango anterior',
      prev: { from: prevFrom, to: prevTo, label: formatRange(prevFrom, prevTo) },
    }
  }
  const monday = selection.week || mondayOf(last)
  const sunday = addDays(monday, 6)
  const prevMonday = addDays(monday, -7)
  return {
    mode: 'week', from: monday, to: sunday, label: `Semana del ${formatRange(monday, sunday)}`, kind: 'semana', prevPhrase: 'la semana anterior',
    prev: { from: prevMonday, to: addDays(prevMonday, 6), label: `Semana del ${formatRange(prevMonday, addDays(prevMonday, 6))}` },
  }
}

export function buildDashboard(records, selection) {
  const period = resolvePeriod(selection, records)
  if (!period) return null
  const current = summarize(inRange(records, period.from, period.to))
  const previous = summarize(inRange(records, period.prev.from, period.prev.to))

  // Acumulado del mes (MTD): mes del último dato cargado, hasta ese día, vs. mismos días del mes anterior
  const mtdPeriod = resolvePeriod({ mode: 'month', month: monthKey(lastDate(records)) }, records)
  const mtd = summarize(inRange(records, mtdPeriod.from, mtdPeriod.to))
  const mtdPrev = summarize(inRange(records, mtdPeriod.prev.from, mtdPeriod.prev.to))

  return {
    period,
    current,
    previous,
    comparison: compareSummaries(current, previous),
    mtd: { period: mtdPeriod, summary: mtd, previous: mtdPrev, comparison: compareSummaries(mtd, mtdPrev) },
    lastLoadedDate: lastDate(records),
  }
}
