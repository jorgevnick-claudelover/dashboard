import { useCallback, useEffect, useState } from 'react'
import { load, save } from '../utils/storage.js'

/** Registros y archivos cargados, persistidos en localStorage. */
export function useRecords() {
  const [records, setRecords] = useState(() => load('records', []))
  const [files, setFiles] = useState(() => load('files', []))
  const [storageError, setStorageError] = useState(null)

  useEffect(() => {
    const ok = save('records', records) && save('files', files)
    setStorageError(ok ? null : 'No se pudo guardar en el navegador (almacenamiento lleno o bloqueado). Los datos se perderán al cerrar la página.')
  }, [records, files])

  const importFile = useCallback(({ name, hash, fresh, duplicates, discarded }) => {
    const id = `${Date.now().toString(36)}-${hash.slice(0, 8)}`
    setRecords((prev) => [...prev, ...fresh.map((r) => ({ ...r, fileId: id }))])
    setFiles((prev) => [
      ...prev,
      { id, name, hash, loadedAt: Date.now(), imported: fresh.length, duplicates: duplicates.length, discarded: discarded.length },
    ])
  }, [])

  const removeFile = useCallback((id) => {
    setRecords((prev) => prev.filter((r) => r.fileId !== id))
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setRecords([])
    setFiles([])
  }, [])

  return { records, files, importFile, removeFile, clearAll, storageError }
}
