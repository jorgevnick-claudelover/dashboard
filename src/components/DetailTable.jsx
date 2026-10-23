import { useMemo, useState } from 'react'
import { formatDate } from '../utils/dates.js'
import { formatInt, formatMoney } from '../utils/money.js'
import { Button, Card } from './ui/index.jsx'

const STEP = 100

/** Detalle de operaciones del periodo; colapsado por defecto y excluido del PDF. */
export default function DetailTable({ records, totalCents, open, onToggle }) {
  const [visible, setVisible] = useState(STEP)
  const rows = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date) || a.ref.localeCompare(b.ref)),
    [records],
  )
  const shown = rows.slice(0, visible)

  return (
    <Card className="no-print">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="detalle-operaciones"
        className="flex w-full items-center justify-between px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-slate-900"
      >
        <span>
          <span className="text-sm font-semibold text-slate-900">Detalle de operaciones</span>
          <span className="ml-2 text-sm text-slate-500">{formatInt(rows.length)} en el periodo</span>
        </span>
        <span aria-hidden="true" className="text-slate-500">{open ? '▲ Ocultar' : '▼ Mostrar'}</span>
      </button>

      {open && (
        <div id="detalle-operaciones" className="border-t border-slate-200">
          {rows.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">No hay operaciones en este periodo.</p>
          ) : (
            <div className="max-h-[32rem] overflow-auto">
              <table className="num w-full min-w-[40rem] text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-2 font-semibold">Fecha</th>
                    <th scope="col" className="px-3 py-2 font-semibold">N.º</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Cliente</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Camión</th>
                    <th scope="col" className="px-5 py-2 text-right font-semibold">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.key} className="border-t border-slate-100">
                      <td className="px-5 py-2">{formatDate(r.date)}</td>
                      <td className="px-3 py-2 text-slate-600">{r.ref || '—'}</td>
                      <td className="px-3 py-2">{r.client || '—'}</td>
                      <td className="px-3 py-2">{r.truck || '—'}</td>
                      <td className="px-5 py-2 text-right">{formatMoney(r.cents)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 bg-slate-50 font-semibold">
                  <tr className="border-t border-slate-300">
                    <td className="px-5 py-2" colSpan={4}>Total del periodo</td>
                    <td className="px-5 py-2 text-right">{formatMoney(totalCents)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          {rows.length > visible && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
              <span>Mostrando {formatInt(visible)} de {formatInt(rows.length)}</span>
              <Button size="sm" onClick={() => setVisible((v) => v + STEP)}>Mostrar {STEP} más</Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
