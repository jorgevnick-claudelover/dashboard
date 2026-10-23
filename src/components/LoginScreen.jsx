import { useState } from 'react'
import { Button, Card, Input } from './ui/index.jsx'

export default function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!onLogin(password)) {
      setError(true)
      setPassword('')
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-sm p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Mudanzas Trébol</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Panel semanal</h1>
        <p className="mt-1 text-sm text-slate-500">Acceso restringido a la dirección.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">Contraseña</label>
          <Input
            id="password"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false) }}
            aria-invalid={error}
            aria-describedby={error ? 'login-error' : undefined}
            className="w-full"
          />
          {error && <p id="login-error" role="alert" className="text-sm text-red-700">Contraseña incorrecta.</p>}
          <Button type="submit" variant="primary" className="w-full">Entrar</Button>
        </form>
      </Card>
    </main>
  )
}
