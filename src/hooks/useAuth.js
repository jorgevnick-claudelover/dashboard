import { useCallback, useState } from 'react'
import { load, remove, save } from '../utils/storage.js'

// Autenticación SIMULADA: la contraseña viaja dentro del código de la página, así que solo
// sirve para filtrar usuarios ocasionales, no como seguridad real.
const PASSWORD = 'Trebol2026'
const SESSION_MS = 12 * 60 * 60 * 1000

const isValid = (session) => Boolean(session?.at) && Date.now() - session.at < SESSION_MS

export function useAuth() {
  const [authed, setAuthed] = useState(() => isValid(load('auth', null)))

  const login = useCallback((password) => {
    if (password !== PASSWORD) return false
    save('auth', { at: Date.now() })
    setAuthed(true)
    return true
  }, [])

  const logout = useCallback(() => {
    remove('auth')
    setAuthed(false)
  }, [])

  return { authed, login, logout }
}
