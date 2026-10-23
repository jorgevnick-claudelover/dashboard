// Las fechas se manejan como texto ISO "YYYY-MM-DD" (sin hora ni zona horaria),
// así no hay desfases por huso horario. Los cálculos usan Date en UTC.

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MONTH_LOOKUP = Object.fromEntries(
  MONTHS.flatMap((m, i) => [[m, i + 1], [MONTHS_SHORT[i], i + 1]]).concat([['set', 9], ['sept', 9]]),
)

const pad = (n) => String(n).padStart(2, '0')

function toUtc(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
function fromUtc(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function makeIso(y, m, d) {
  if (!(y >= 1900 && y <= 2200) || !(m >= 1 && m <= 12) || !(d >= 1 && d <= 31)) return null
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  return `${y}-${pad(m)}-${pad(d)}`
}

/** Acepta serial de Excel, ISO, dd/mm/yyyy (formato peruano), dd-mm-yyyy, "5 de octubre de 2026"… */
export function parseDate(value) {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : makeIso(value.getFullYear(), value.getMonth() + 1, value.getDate())
  }
  if (typeof value === 'number') {
    if (value < 20000 || value > 80000) return null
    // Serial de Excel (sistema 1900): día 25569 = 1970-01-01
    return fromUtc(new Date(Math.round((value - 25569) * 86400000)))
  }
  const s = String(value).trim()
  if (!s) return null
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/)
  if (m) return makeIso(+m[1], +m[2], +m[3])
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})(?:[T\s].*)?$/)
  if (m) {
    const year = m[3].length === 2 ? 2000 + +m[3] : +m[3]
    return makeIso(year, +m[2], +m[1])
  }
  m = s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .match(/^(\d{1,2})\s*(?:de\s+)?([a-z]+)\.?\s*(?:de\s+|del\s+)?(\d{4})$/)
  if (m && MONTH_LOOKUP[m[2]]) return makeIso(+m[3], MONTH_LOOKUP[m[2]], +m[1])
  if (/^\d{5}$/.test(s)) return parseDate(Number(s))
  return null
}

export function addDays(iso, n) {
  const date = toUtc(iso)
  date.setUTCDate(date.getUTCDate() + n)
  return fromUtc(date)
}

export function diffDays(a, b) {
  return Math.round((toUtc(a) - toUtc(b)) / 86400000)
}

/** Lunes de la semana (semanas de lunes a domingo). */
export function mondayOf(iso) {
  const dow = (toUtc(iso).getUTCDay() + 6) % 7
  return addDays(iso, -dow)
}

export const monthKey = (iso) => iso.slice(0, 7)
export const monthStart = (key) => `${key}-01`
export function monthEnd(key) {
  const [y, m] = key.split('-').map(Number)
  return fromUtc(new Date(Date.UTC(y, m, 0)))
}
export function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`
}

/** 2026-10-13 → "13/10/2026" */
export function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** 2026-10-13 → "13 oct" */
export function formatDayMonth(iso) {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS_SHORT[m - 1]}`
}

export function formatLong(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const weekday = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][toUtc(iso).getUTCDay()]
  return `${weekday} ${d} ${MONTHS_SHORT[m - 1]} ${y}`
}

export function formatRange(from, to) {
  const [fy] = from.split('-')
  const [ty] = to.split('-')
  if (from === to) return `${formatDayMonth(from)} ${fy}`
  return fy === ty
    ? `${formatDayMonth(from)} – ${formatDayMonth(to)} ${ty}`
    : `${formatDayMonth(from)} ${fy} – ${formatDayMonth(to)} ${ty}`
}

export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  const name = MONTHS[m - 1]
  return `${name[0].toUpperCase()}${name.slice(1)} ${y}`
}

export function formatDateTime(ms) {
  const d = new Date(ms)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
