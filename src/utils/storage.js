// Toda la persistencia pasa por aquí. Cada lectura/escritura va protegida: localStorage
// puede estar bloqueado (modo privado) o llenarse (≈5 MB).
const PREFIX = 'trebol:v1:'

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

/** Devuelve true si se guardó; false si el navegador lo rechazó (p. ej. cuota llena). */
export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* sin acceso a localStorage: nada que borrar */
  }
}
