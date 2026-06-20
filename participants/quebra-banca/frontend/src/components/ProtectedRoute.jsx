import { Navigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, token, loading } = useAuth()

  if (loading) return <div className="spinner" />
  if (!token || !user) return <Navigate to="/login" replace />

  return children
}
