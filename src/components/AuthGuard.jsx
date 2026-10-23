import LoginScreen from './LoginScreen.jsx'

/** Solo renderiza a sus hijos si hay sesión; si no, muestra el login. */
export default function AuthGuard({ auth, children }) {
  return auth.authed ? children : <LoginScreen onLogin={auth.login} />
}
