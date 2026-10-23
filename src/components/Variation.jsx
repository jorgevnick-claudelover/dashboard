import { formatInt, formatMoney, formatPct } from '../utils/money.js'

/** Variación frente al periodo anterior: verde si sube, rojo si baja, gris si no cambia. Nada más. */
export default function Variation({ data, unit = 'money', label }) {
  if (!data) {
    return <p className="text-xs text-slate-500 print:text-[10px]">Sin datos {label ? `de ${label}` : 'del periodo anterior'}</p>
  }
  const { diff, pct } = data
  const tone = diff > 0 ? 'text-up' : diff < 0 ? 'text-down' : 'text-slate-500'
  const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '•'
  const amount = unit === 'money' ? formatMoney(diff, { sign: true }) : `${diff > 0 ? '+' : diff < 0 ? '−' : ''}${formatInt(Math.abs(diff))}`
  return (
    <p className={`num flex flex-wrap items-center gap-x-2 text-sm font-medium print:text-[11px] ${tone}`}>
      <span aria-hidden="true">{arrow}</span>
      <span>{amount}</span>
      <span>({formatPct(pct)})</span>
    </p>
  )
}
