// Normalización de textos de los archivos exportados: "MUDANZAS HNOS. PEREZ SAC"
// → "Mudanzas Hermanos Pérez S.A.C." (sin inventar tildes que no estén en el origen).

const SMALL_WORDS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'o', 'u', 'en', 'con', 'por', 'para'])

const LEGAL_FORMS = {
  sac: 'S.A.C.', sa: 'S.A.', srl: 'S.R.L.', eirl: 'E.I.R.L.', sca: 'S.C.A.', scrl: 'S.C.R.L.', ltda: 'Ltda.',
}

// Abreviaturas habituales en exportaciones de TPV/ERP peruanos (clave sin tildes ni puntos).
const ABBREVIATIONS = {
  hnos: 'Hermanos', hno: 'Hermano', cia: 'Compañía', cdad: 'Ciudad', dpto: 'Departamento', dep: 'Departamento',
  av: 'Avenida', avda: 'Avenida', jr: 'Jirón', urb: 'Urbanización', psje: 'Pasaje', mz: 'Manzana',
  sr: 'Señor', sra: 'Señora', srta: 'Señorita', ing: 'Ingeniero', dr: 'Doctor', dra: 'Doctora', lic: 'Licenciado',
  mud: 'Mudanzas', transp: 'Transportes', transpt: 'Transportes', distrib: 'Distribuidora', inv: 'Inversiones',
  com: 'Comercial', corp: 'Corporación', ind: 'Industrias', serv: 'Servicios', const: 'Constructora',
  asoc: 'Asociación', coop: 'Cooperativa', ofic: 'Oficina', oficina: 'Oficina',
}

export function fold(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const capitalize = (word) => (word ? word[0].toUpperCase() + word.slice(1) : word)

function capitalizeWord(word) {
  // "o'brien", "juan-carlos", "ate/vitarte": cada segmento empieza en mayúscula
  return word.replace(/[\p{L}\p{N}]+/gu, (part) => capitalize(part))
}

export function titleCase(value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  const out = text.split(' ').map((token, index) => {
    const match = token.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u)
    const [, lead, body, trail] = match
    const lower = body.toLowerCase()
    const bare = fold(lower).replace(/\./g, '')
    if (!bare) return token
    if (LEGAL_FORMS[bare]) return `${lead}${LEGAL_FORMS[bare]}${trail.replace(/^\./, '')}`
    if (ABBREVIATIONS[bare]) return `${lead}${ABBREVIATIONS[bare]}${trail.replace(/^\./, '')}`
    if (index > 0 && SMALL_WORDS.has(lower)) return `${lead}${lower}${trail}`
    return `${lead}${capitalizeWord(lower)}${trail}`
  })
  return out.join(' ')
}

const PLATE = /^([a-z0-9]{3})[\s-]?([a-z0-9]{3,4})$/i
const TRUCK_NUMBER = /^(?:camion|cam|cmn|truck|unidad|u|c)\.?\s*[-#nº°]*\s*(\d{1,2})$/

/** Camiones: placas en mayúsculas ("abc123" → "ABC-123"), "CAM 3"/"camion3" → "Camión 3". */
export function normalizeTruck(value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  const numbered = fold(text).match(TRUCK_NUMBER)
  if (numbered) return `Camión ${Number(numbered[1])}`
  const compact = text.replace(/\s+/g, '')
  if (/\d/.test(compact) && /[a-z]/i.test(compact) && PLATE.test(text)) {
    const m = text.match(PLATE)
    return `${m[1]}-${m[2]}`.toUpperCase()
  }
  return titleCase(text)
}

export const normalizeName = titleCase

export function normalizeRef(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().toUpperCase()
}
