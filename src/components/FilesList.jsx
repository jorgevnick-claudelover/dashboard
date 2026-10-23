import { formatDateTime } from '../utils/dates.js'
import { formatInt } from '../utils/money.js'
import { Button, Card } from './ui/index.jsx'

export default function FilesList({ files, onRemove, onClear }) {
  if (!files.length) return null
  return (
    <Card className="no-print">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Archivos cargados <span className="font-normal text-slate-500">({files.length})</span></h2>
        <Button
          size="sm"
          variant="danger"
          onClick={() => {
            if (window.confirm('¿Borrar TODOS los datos cargados de este navegador? No se puede deshacer.')) onClear()
          }}
        >
          Vaciar todo
        </Button>
      </div>
      <ul className="divide-y divide-slate-100 border-t border-slate-200">
        {files.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">{f.name}</p>
              <p className="num text-xs text-slate-500">
                {formatDateTime(f.loadedAt)} · {formatInt(f.imported)} operaciones
                {f.duplicates ? ` · ${formatInt(f.duplicates)} duplicadas omitidas` : ''}
                {f.discarded ? ` · ${formatInt(f.discarded)} filas descartadas` : ''}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (window.confirm(`¿Eliminar los datos de «${f.name}»?`)) onRemove(f.id)
              }}
            >
              Eliminar
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
