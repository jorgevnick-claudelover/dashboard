import { addDays, formatRange, monthLabel } from '../utils/dates.js'
import { Input, Select } from './ui/index.jsx'

const MODES = [
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'range', label: 'Rango' },
]

export default function PeriodSelector({ selection, onChange, weeks, months, period }) {
  const set = (patch) => onChange({ ...selection, ...patch })
  const setMode = (mode) => {
    if (mode === 'range') set({ mode, from: selection.from || period.from, to: selection.to || period.to })
    else set({ mode })
  }

  return (
    <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Selector de periodo">
      <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5" role="radiogroup" aria-label="Tipo de periodo">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={selection.mode === m.id}
            onClick={() => setMode(m.id)}
            className={`h-8 rounded px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-slate-900 ${
              selection.mode === m.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {selection.mode === 'week' && (
        <Select
          aria-label="Semana"
          value={selection.week || weeks[0]}
          onChange={(e) => set({ week: e.target.value === weeks[0] ? null : e.target.value })}
        >
          {weeks.map((monday, i) => (
            <option key={monday} value={monday}>
              {formatRange(monday, addDays(monday, 6))}{i === 0 ? ' (última cargada)' : ''}
            </option>
          ))}
        </Select>
      )}

      {selection.mode === 'month' && (
        <Select aria-label="Mes" value={selection.month || months[0]} onChange={(e) => set({ month: e.target.value })}>
          {months.map((key) => (
            <option key={key} value={key}>{monthLabel(key)}</option>
          ))}
        </Select>
      )}

      {selection.mode === 'range' && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <label className="flex items-center gap-2">
            Desde
            <Input type="date" value={selection.from || ''} max={selection.to || undefined} onChange={(e) => set({ from: e.target.value })} />
          </label>
          <label className="flex items-center gap-2">
            Hasta
            <Input type="date" value={selection.to || ''} min={selection.from || undefined} onChange={(e) => set({ to: e.target.value })} />
          </label>
        </div>
      )}
    </div>
  )
}
