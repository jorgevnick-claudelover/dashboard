import Decimal from 'decimal.js'

// Todo el dinero vive como entero en céntimos. Los enteros se suman sin error de
// coma flotante; las divisiones (medias, porcentajes) pasan por Decimal con
// redondeo "half up" a 2 decimales.
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP })

export const CURRENCY = 'S/'

const CURRENCY_NOISE = /s\/\.?|pen|soles?|usd|us\$|\$|€|eur/gi

/** Convierte un importe (número de Excel o texto "S/ 1,234.50", "1.234,50"…) a céntimos enteros. */
export function toCents(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    return new Decimal(value).times(100).toDecimalPlaces(0).toNumber()
  }
  let s = String(value).trim().replace(CURRENCY_NOISE, '').replace(/\s+/g, '')
  if (!s) return null
  const negative = /^\(.*\)$/.test(s) || /^-/.test(s) || /-$/.test(s)
  s = s.replace(/[^\d,.]/g, '')
  if (!/\d/.test(s)) return null

  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  let decimalSep = null
  if (lastComma >= 0 && lastDot >= 0) {
    decimalSep = lastComma > lastDot ? ',' : '.'
  } else if (lastComma >= 0 || lastDot >= 0) {
    const sep = lastComma >= 0 ? ',' : '.'
    const occurrences = s.split(sep).length - 1
    const digitsAfter = s.length - s.lastIndexOf(sep) - 1
    // "1,234" o "1.234.567" → miles; "12,5" o "12.50" → decimales
    if (occurrences === 1 && digitsAfter !== 3) decimalSep = sep
  }
  let normalized = s
  if (decimalSep) {
    const idx = s.lastIndexOf(decimalSep)
    const intPart = s.slice(0, idx).replace(/[.,]/g, '')
    const frac = s.slice(idx + 1).replace(/[.,]/g, '')
    normalized = `${intPart || '0'}.${frac}`
  } else {
    normalized = s.replace(/[.,]/g, '')
  }
  let dec
  try {
    dec = new Decimal(normalized)
  } catch {
    return null
  }
  const cents = dec.times(100).toDecimalPlaces(0).toNumber()
  return negative ? -cents : cents
}

/** Media en céntimos, redondeada a 2 decimales (half up). null si no hay operaciones. */
export function averageCents(totalCents, count) {
  if (!count) return null
  return new Decimal(totalCents).div(count).toDecimalPlaces(0).toNumber()
}

/** Variación porcentual con 2 decimales, como número. null si la base es 0 o no existe. */
export function pctChange(current, previous) {
  if (previous === null || previous === undefined || previous === 0) return null
  return new Decimal(current)
    .minus(previous)
    .div(Decimal.abs(previous))
    .times(100)
    .toDecimalPlaces(2)
    .toNumber()
}

function group(intStr) {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** 123456 → "S/ 1,234.56" (sin pasar por coma flotante). */
export function formatMoney(cents, { sign = false, symbol = true } = {}) {
  if (cents === null || cents === undefined) return '—'
  const abs = Math.abs(cents)
  const text = `${group(String(Math.trunc(abs / 100)))}.${String(abs % 100).padStart(2, '0')}`
  const prefix = cents < 0 ? '−' : sign && cents > 0 ? '+' : ''
  return `${prefix}${symbol ? `${CURRENCY} ` : ''}${text}`
}

export function formatInt(n) {
  return group(String(n))
}

export function formatPct(pct, { sign = true } = {}) {
  if (pct === null || pct === undefined) return 'n/d'
  const prefix = pct < 0 ? '−' : sign && pct > 0 ? '+' : ''
  return `${prefix}${Math.abs(pct).toFixed(2)} %`
}
