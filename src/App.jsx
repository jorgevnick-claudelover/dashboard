import { useEffect, useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import AuthGuard from './components/AuthGuard.jsx'
import Dashboard from './components/Dashboard.jsx'
import DetailTable from './components/DetailTable.jsx'
import FilesList from './components/FilesList.jsx'
import Header from './components/Header.jsx'
import PeriodSelector from './components/PeriodSelector.jsx'
import UploadPanel from './components/UploadPanel.jsx'
import { Alert, Card } from './components/ui/index.jsx'
import { useAuth } from './hooks/useAuth.js'
import { useRecords } from './hooks/useRecords.js'
import { availableMonths, availableWeeks, buildDashboard, inRange } from './utils/metrics.js'
import { load, save } from './utils/storage.js'

const DEFAULT_UI = { selection: { mode: 'week', week: null, month: null, from: null, to: null }, tableOpen: false }

function Panel({ onLogout }) {
  const { records, files, importFile, removeFile, clearAll, storageError } = useRecords()
  const [ui, setUi] = useState(() => ({ ...DEFAULT_UI, ...load('ui', {}) }))
  const [uploadOpen, setUploadOpen] = useState(() => load('records', []).length === 0)
  const printRef = useRef(null)

  useEffect(() => { save('ui', ui) }, [ui])

  const weeks = useMemo(() => availableWeeks(records), [records])
  const months = useMemo(() => availableMonths(records), [records])

  // Si la semana/mes guardados ya no existen (se borró un archivo), se vuelve al último cargado
  const selection = useMemo(() => {
    const s = ui.selection
    return {
      ...s,
      week: s.week && weeks.includes(s.week) ? s.week : null,
      month: s.month && months.includes(s.month) ? s.month : null,
    }
  }, [ui.selection, weeks, months])

  const dash = useMemo(() => (records.length ? buildDashboard(records, selection) : null), [records, selection])
  const periodRecords = useMemo(() => (dash ? inRange(records, dash.period.from, dash.period.to) : []), [records, dash])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: dash ? `Mudanzas Trébol - ${dash.period.label}` : 'Mudanzas Trébol',
    pageStyle: '@page { size: A4 portrait; margin: 12mm; }',
  })

  return (
    <div className="min-h-screen">
      <Header
        uploadOpen={uploadOpen}
        onToggleUpload={() => setUploadOpen((o) => !o)}
        onPrint={handlePrint}
        onLogout={onLogout}
        canPrint={Boolean(dash)}
      />
      <main className="print-sheet mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        {storageError && <Alert tone="danger" className="no-print">{storageError}</Alert>}

        {(uploadOpen || !dash) && <UploadPanel records={records} files={files} onImport={importFile} />}

        {dash ? (
          <>
            <div className="no-print">
              <PeriodSelector
                selection={selection}
                onChange={(s) => setUi((u) => ({ ...u, selection: s }))}
                weeks={weeks}
                months={months}
                period={dash.period}
              />
            </div>
            <Dashboard dash={dash} printRef={printRef} />
            <DetailTable
              records={periodRecords}
              totalCents={dash.current.totalCents}
              open={ui.tableOpen}
              onToggle={() => setUi((u) => ({ ...u, tableOpen: !u.tableOpen }))}
            />
            <FilesList files={files} onRemove={removeFile} onClear={clearAll} />
          </>
        ) : (
          <Card className="no-print p-8 text-center text-sm text-slate-600">
            Todavía no hay datos. Sube el primer archivo semanal para ver el panel.
          </Card>
        )}
      </main>
    </div>
  )
}

export default function App() {
  const auth = useAuth()
  return (
    <AuthGuard auth={auth}>
      <Panel onLogout={auth.logout} />
    </AuthGuard>
  )
}
