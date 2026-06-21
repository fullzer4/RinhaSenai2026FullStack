import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('qb_token'))
  const [user, setUser]   = useState(null)
  const [loading, setLoading] = useState(true)

  const loadMe = useCallback(async (t) => {
    if (!t) { setUser(null); setLoading(false); return }
    try {
      const r = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
      if (r.ok) setUser(await r.json())
      else { setUser(null); setToken(null); localStorage.removeItem('qb_token') }
    } catch { setUser(null) }
    setLoading(false)
  }, [])

  useEffect(() => { loadMe(token) }, [token, loadMe])

  function login(t, u) {
    localStorage.setItem('qb_token', t)
    setToken(t)
    setUser(u)
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    } catch {}
    localStorage.removeItem('qb_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
