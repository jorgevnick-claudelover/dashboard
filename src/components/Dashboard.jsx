import { formatDate, formatDateTime, formatLong, formatRange } from '../utils/dates.js'
import { formatInt, formatMoney, formatPct } from '../utils/money.js'
import KpiCard from './KpiCard.jsx'
import Variation from './Variation.jsx'
import { Card } from './ui/index.jsx'

function DayCard({ label, day }) {
  return (
    <KpiCard
      className="print:col-span-3"
      label={label}
      value={day ? formatMoney(day.totalCents) : '—'}
      hint={day ? `${formatLong(day.date)} · ${formatInt(day.count)} ${day.count === 1 ? 'operación' : 'operaciones'}` : 'Sin operaciones'}
    />
  )
}

function ComparisonTable({ dash }) {
  const { current, previous, period, comparison } = dash
  const total = comparison.total
  const tone = !total ? '' : total.diff > 0 ? 'text-up' : total.diff < 0 ? 'text-down' : 'text-slate-500'
  const rows = [
    ['Periodo actual', period.label, formatMoney(current.totalCents)],
    ['Periodo anterior', period.prev.label, previous.count ? formatMoney(previous.totalCents) : 'Sin datos'],
  ]
  return (
    <Card className="print-card p-5 print:col-span-6 print:p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 print:text-[9px]">
        Comparativa con {period.prevPhrase}
      </h3>
      <table className="num mt-3 w-full text-sm print:mt-1.5 print:text-[11px]">
        <tbody>
          {rows.map(([name, detail, value]) => (
            <tr key={name} className="border-b border-slate-100">
              <th scope="row" className="py-2 pr-4 text-left font-medium text-slate-700 print:py-1">
                {name}
                <span className="block text-xs font-normal text-slate-500 print:text-[10px]">{detail}</span>
              </th>
              <td className="whitespace-nowrap py-2 text-right font-semibold text-slate-900 print:py-1">{value}</td>
            </tr>
          ))}
          <tr className="border-b border-slate-100">
            <th scope="row" className="py-2 pr-4 text-left font-medium text-slate-700 print:py-1">Diferencia en importe</th>
            <td className={`whitespace-nowrap py-2 text-right font-semibold print:py-1 ${tone}`}>{total ? formatMoney(total.diff, { sign: true }) : 'n/d'}</td>
          </tr>
          <tr>
            <th scope="row" className="py-2 pr-4 text-left font-medium text-slate-700 print:py-1">Variación</th>
            <td className={`whitespace-nowrap py-2 text-right font-semibold print:py-1 ${tone}`}>{total ? formatPct(total.pct) : 'n/d'}</td>
          </tr>
        </tbody>
      </table>
    </Card>
  )
}

function MtdCard({ mtd }) {
  const { summary, comparison, period } = mtd
  return (
    <Card className="print-card p-5 print:p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 print:text-[9px]">Acumulado del mes (MTD)</h3>
        <p className="text-xs text-slate-500 print:text-[10px]">
          {period.label} · {formatRange(period.from, period.to)} · vs. {period.prev.label}
        </p>
      </div>
      <div className="mt-3 grid gap-5 sm:grid-cols-3 print:mt-1.5 print:grid-cols-3 print:gap-3">
        <div>
          <p className="text-xs text-slate-500 print:text-[10px]">Volumen total</p>
          <p className="num text-2xl font-semibold print:text-lg">{formatMoney(summary.totalCents)}</p>
          <Variation data={comparison.hasPrevious ? comparison.total : null} />
        </div>
        <div>
          <p className="text-xs text-slate-500 print:text-[10px]">Operaciones</p>
          <p className="num text-2xl font-semibold print:text-lg">{formatInt(summary.count)}</p>
          <Variation data={comparison.hasPrevious ? comparison.count : null} unit="int" />
        </div>
        <div>
          <p className="text-xs text-slate-500 print:text-[10px]">Importe medio</p>
          <p className="num text-2xl font-semibold print:text-lg">{formatMoney(summary.avgCents)}</p>
          <Variation data={comparison.hasPrevious ? comparison.avg : null} />
        </div>
      </div>
    </Card>
  )
}

/** Contenido imprimible: es lo que se envía al PDF (los controles viven fuera, en .no-print). */
export default function Dashboard({ dash, printRef }) {
  const { current, period, comparison, mtd } = dash
  const ifPrev = (variation) => (comparison.hasPrevious ? variation : null)

  return (
    <div ref={printRef} className="print-sheet space-y-4 print:space-y-3">
      <header className="print-only">
        <div className="flex items-end justify-between border-b border-slate-400 pb-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Mudanzas Trébol</p>
            <h1 className="text-lg font-semibold">Resumen {period.kind === 'semana' ? 'semanal' : period.kind === 'mes' ? 'mensual' : 'del periodo'}</h1>
          </div>
          <p className="text-right text-[10px] text-slate-600">
            {period.label}
            <br />
            Emitido el {formatDateTime(Date.now())}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="text-lg font-semibold text-slate-900 print:text-sm">{period.label}</h2>
        <p className="text-sm text-slate-500 print:text-[10px]">
          {current.count
            ? `Datos del ${formatDate(current.firstDate)} al ${formatDate(current.lastDate)} · ${current.days.length} ${current.days.length === 1 ? 'día' : 'días'} con operaciones`
            : 'Sin operaciones en este periodo'}
          {' · '}comparado con {period.prev.label}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-6 print:gap-2">
        <KpiCard className="print:col-span-2" label="Volumen total" value={formatMoney(current.totalCents)} hint={`${formatInt(current.count)} operaciones`}>
          <Variation data={ifPrev(comparison.total)} />
        </KpiCard>
        <KpiCard className="print:col-span-2" label="Operaciones" value={formatInt(current.count)}>
          <Variation data={ifPrev(comparison.count)} unit="int" />
        </KpiCard>
        <KpiCard className="print:col-span-2" label="Importe medio" value={formatMoney(current.avgCents)} hint="Volumen total ÷ operaciones">
          <Variation data={ifPrev(comparison.avg)} />
        </KpiCard>
        <DayCard label="Mejor día" day={current.best} />
        <DayCard label="Peor día" day={current.worst} />
        <ComparisonTable dash={dash} />
      </div>

      <MtdCard mtd={mtd} />
    </div>
  )
}
