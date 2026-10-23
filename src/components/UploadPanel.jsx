import { useEffect, useMemo, useRef, useState } from 'react'
import { FIELDS } from '../utils/columns.js'
import { contentHash, planImport } from '../utils/dedupe.js'
import { formatDate, formatDateTime } from '../utils/dates.js'
import { formatInt, formatMoney } from '../utils/money.js'
import { buildRecords, inspectFile, missingFields } from '../utils/parseFile.js'
import { fetchSampleFiles } from '../utils/sampleData.js'
import { Alert, Button, Card, Select } from './ui/index.jsx'

const ACCEPT = '.csv,.txt,.xlsx,.xls,.xlsm'

function Stat({ label, value, tone }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`num text-lg font-semibold ${tone || 'text-slate-900'}`}>{value}</dd>
    </div>
  )
}

function Review({ draft, setMapping, analysis, onConfirm, onCancel, queueLeft }) {
  const missing = missingFields(draft.mapping)
  const { built, plan } = analysis || {}
  const freshTotal = plan ? plan.fresh.reduce((sum, r) => sum + r.cents, 0) : 0
  const blocked = !plan || plan.fileAlreadyLoaded || plan.fresh.length === 0

  return (
    <div className="space-y-4 border-t border-slate-200 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">
          Revisar «{draft.fileName}»{draft.sheetName ? <span className="font-normal text-slate-500"> · hoja {draft.sheetName}</span> : null}
        </h3>
        {queueLeft > 0 && <span className="text-xs text-slate-500">Quedan {queueLeft} archivo(s) en cola</span>}
      </div>

      <details open={missing.length > 0} className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">Columnas detectadas</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="text-xs font-medium text-slate-600">
              {f.label}{f.required ? ' *' : ''}
              <Select
                className="mt-1 w-full"
                value={draft.mapping[f.key] ?? ''}
                onChange={(e) => setMapping(f.key, e.target.value === '' ? null : Number(e.target.value))}
              >
                <option value="">{f.required ? '— elegir columna —' : '— no usar —'}</option>
                {draft.headers.map((h, i) => (h ? <option key={i} value={i}>{h}</option> : null))}
              </Select>
            </label>
          ))}
        </div>
      </details>

      {missing.length > 0 && (
        <Alert tone="danger">Falta indicar la columna de: {missing.map((f) => f.label).join(' y ')}.</Alert>
      )}

      {built && plan && (
        <>
          {plan.sameFile ? (
            <Alert tone="danger">
              <strong>Este archivo ya está cargado</strong> (como «{plan.sameFile.name}» el {formatDateTime(plan.sameFile.loadedAt)}). No se importará de nuevo para evitar duplicar datos.
            </Alert>
          ) : plan.fresh.length === 0 && built.records.length > 0 ? (
            <Alert tone="danger">
              <strong>Todas las operaciones de este archivo ya existen.</strong> No hay nada nuevo que importar.
            </Alert>
          ) : plan.duplicates.length > 0 ? (
            <Alert tone="warn">
              <strong>{formatInt(plan.duplicates.length)} de {formatInt(built.records.length)} filas ya estaban cargadas</strong> (probablemente por fechas solapadas con otro archivo). Se omitirán; solo se importarán las {formatInt(plan.fresh.length)} nuevas.
            </Alert>
          ) : null}

          {built.records.length === 0 && <Alert tone="danger">No se encontró ninguna fila válida con fecha e importe.</Alert>}

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Filas con datos" value={formatInt(built.rowsRead - built.emptyRows)} />
            <Stat label="Filas vacías quitadas" value={formatInt(built.emptyRows)} />
            <Stat label="Filas descartadas" value={formatInt(built.discarded.length)} tone={built.discarded.length ? 'text-amber-700' : undefined} />
            <Stat label="Duplicadas omitidas" value={formatInt(plan.duplicates.length)} />
            <Stat label="Operaciones a importar" value={formatInt(plan.fresh.length)} />
            <Stat label="Importe a importar" value={formatMoney(freshTotal)} />
          </dl>
          {plan.fresh.length > 0 && (
            <p className="text-xs text-slate-500">
              Fechas: {formatDate(plan.fresh.reduce((m, r) => (r.date < m ? r.date : m), plan.fresh[0].date))} al{' '}
              {formatDate(plan.fresh.reduce((m, r) => (r.date > m ? r.date : m), plan.fresh[0].date))}. Contrasta este importe con la hoja de control antes de importar.
            </p>
          )}

          {built.discarded.length > 0 && (
            <details className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <summary className="cursor-pointer font-medium">{built.discarded.length} fila(s) descartada(s): revisa que no sean operaciones</summary>
              <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs">
                {built.discarded.slice(0, 50).map((d) => (
                  <li key={d.row}><span className="num font-medium">Fila {d.row}:</span> {d.reason} — <span className="text-amber-800">{d.preview || '(vacía)'}</span></li>
                ))}
              </ul>
            </details>
          )}

          {built.records.length > 0 && (
            <details className="rounded-md border border-slate-200 px-4 py-3 text-sm">
              <summary className="cursor-pointer font-medium text-slate-700">Vista previa normalizada (5 primeras filas)</summary>
              <table className="num mt-2 w-full text-xs">
                <tbody>
                  {built.records.slice(0, 5).map((r) => (
                    <tr key={r.key} className="border-t border-slate-100">
                      <td className="py-1 pr-3">{formatDate(r.date)}</td>
                      <td className="py-1 pr-3">{r.ref || '—'}</td>
                      <td className="py-1 pr-3">{r.client || '—'}</td>
                      <td className="py-1 pr-3">{r.truck || '—'}</td>
                      <td className="py-1 text-right">{formatMoney(r.cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" disabled={blocked || missing.length > 0} onClick={onConfirm}>
          {plan && plan.fresh.length ? `Importar ${formatInt(plan.fresh.length)} operaciones` : 'Importar'}
        </Button>
        <Button onClick={onCancel}>{queueLeft > 0 ? 'Omitir este archivo' : 'Cancelar'}</Button>
      </div>
    </div>
  )
}

export default function UploadPanel({ records, files, onImport }) {
  const inputRef = useRef(null)
  const loadingRef = useRef(false)
  const [queue, setQueue] = useState([])
  const [draft, setDraft] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  // Siguiente archivo de la cola → borrador. El ref evita lecturas simultáneas (también con StrictMode).
  useEffect(() => {
    if (draft || busy || loadingRef.current || queue.length === 0) return
    loadingRef.current = true
    setBusy(true)
    const [file, ...rest] = queue
    inspectFile(file)
      .then((d) => { setDraft(d); setNotice(null) })
      .catch(() => setError(`No se pudo leer «${file.name}». Comprueba que sea un CSV o Excel válido.`))
      .finally(() => { setQueue(rest); loadingRef.current = false; setBusy(false) })
  }, [queue, draft, busy])

  // Recalcula registros, huella y duplicados cuando cambia el mapeo o los datos guardados
  const built = useMemo(
    () => (draft && missingFields(draft.mapping).length === 0 ? buildRecords(draft.matrix, draft.headerRow, draft.mapping) : null),
    [draft],
  )
  useEffect(() => {
    if (!built) { setAnalysis(null); return }
    let cancelled = false
    contentHash(built.records).then((hash) => {
      if (!cancelled) setAnalysis({ built, hash, plan: planImport(built.records, hash, records, files) })
    })
    return () => { cancelled = true }
  }, [built, records, files])

  const accept = (fileList) => {
    const list = [...fileList]
    if (!list.length) return
    setError(null)
    setQueue((q) => [...q, ...list])
  }

  // Importa los 3 archivos de ejemplo con el mismo flujo que uno propio (parseo → huella → antiduplicados)
  const loadSamples = async () => {
    setError(null)
    setBusy(true)
    try {
      let knownRecords = records
      let knownFiles = files
      let imported = 0
      for (const file of await fetchSampleFiles()) {
        const d = await inspectFile(file)
        const b = buildRecords(d.matrix, d.headerRow, d.mapping)
        const hash = await contentHash(b.records)
        const plan = planImport(b.records, hash, knownRecords, knownFiles)
        if (plan.fileAlreadyLoaded || !plan.fresh.length) continue
        onImport({ name: file.name, hash, fresh: plan.fresh, duplicates: plan.duplicates, discarded: b.discarded })
        knownRecords = [...knownRecords, ...plan.fresh]
        knownFiles = [...knownFiles, { hash, name: file.name }]
        imported += plan.fresh.length
      }
      setNotice(imported ? `Datos de ejemplo cargados: ${formatInt(imported)} operaciones.` : 'Los datos de ejemplo ya estaban cargados.')
    } catch {
      setError('No se pudieron cargar los datos de ejemplo.')
    } finally {
      setBusy(false)
    }
  }

  const finish = () => { setDraft(null); setAnalysis(null) }
  const confirm = () => {
    const { plan, hash, built: b } = analysis
    onImport({ name: draft.fileName, hash, fresh: plan.fresh, duplicates: plan.duplicates, discarded: b.discarded })
    setNotice(`«${draft.fileName}»: ${formatInt(plan.fresh.length)} operaciones importadas${plan.duplicates.length ? `, ${formatInt(plan.duplicates.length)} duplicadas omitidas` : ''}.`)
    finish()
  }

  return (
    <Card className="no-print">
      <div className="p-5">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files) }}
          className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
            dragging ? 'border-slate-900 bg-slate-100' : 'border-slate-300 bg-slate-50'
          }`}
        >
          <p className="text-sm font-medium text-slate-800">Arrastra aquí tus exportaciones semanales (CSV o Excel)</p>
          <p className="text-xs text-slate-500">Puedes subir uno o varios archivos. Se revisan antes de guardarse.</p>
          <Button variant="primary" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? 'Leyendo…' : 'Elegir archivos'}
          </Button>
          <button
            type="button"
            onClick={loadSamples}
            disabled={busy}
            className="text-xs font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900 disabled:opacity-50"
          >
            o cargar los datos de ejemplo
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-label="Subir archivos CSV o Excel"
            onChange={(e) => { accept(e.target.files); e.target.value = '' }}
          />
        </div>
        {error && <Alert tone="danger" className="mt-4">{error}</Alert>}
        {notice && !draft && <Alert tone="info" className="mt-4">{notice}</Alert>}
      </div>

      {draft && (
        <Review
          draft={draft}
          setMapping={(key, idx) => setDraft((d) => ({ ...d, mapping: { ...d.mapping, [key]: idx } }))}
          analysis={analysis}
          onConfirm={confirm}
          onCancel={finish}
          queueLeft={queue.length}
        />
      )}
    </Card>
  )
}
