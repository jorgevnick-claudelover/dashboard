import { Button } from './ui/index.jsx'

export default function Header({ onToggleUpload, uploadOpen, onPrint, onLogout, canPrint }) {
  return (
    <header className="no-print border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Mudanzas Trébol</p>
          <h1 className="text-lg font-semibold leading-tight text-slate-900">Panel semanal</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onToggleUpload} aria-expanded={uploadOpen}>{uploadOpen ? 'Cerrar carga' : 'Cargar datos'}</Button>
          <Button variant="primary" onClick={onPrint} disabled={!canPrint}>Imprimir / PDF</Button>
          <Button variant="ghost" onClick={onLogout}>Salir</Button>
        </div>
      </div>
    </header>
  )
}
