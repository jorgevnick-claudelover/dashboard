// Sistema antiduplicados: huella del archivo + clave por registro.

/** Hash determinista del contenido (no del formato): el mismo dato en CSV o Excel da la misma huella. */
export async function contentHash(records) {
  const canonical = records
    .map((r) => r.key)
    .sort()
    .join('\n')
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(canonical)
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  return fallbackHash(canonical)
}

// cyrb53, para contextos sin crypto.subtle (p. ej. abrir el HTML por http sin TLS)
function fallbackHash(str) {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return `f-${(4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)}`
}

/**
 * Compara los registros de un archivo con lo ya guardado.
 * - fileAlreadyLoaded: misma huella que un archivo cargado antes → se bloquea.
 * - fresh: registros nuevos; duplicates: ya existían (misma clave) y se omiten.
 */
export function planImport(records, hash, existingRecords, existingFiles) {
  const known = new Set(existingRecords.map((r) => r.key))
  const fresh = []
  const duplicates = []
  for (const r of records) (known.has(r.key) ? duplicates : fresh).push(r)
  const sameFile = existingFiles.find((f) => f.hash === hash) || null
  return {
    fresh,
    duplicates,
    sameFile,
    fileAlreadyLoaded: Boolean(sameFile) || (records.length > 0 && fresh.length === 0),
  }
}
