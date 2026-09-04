import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'


import Spinner from '../ui/Spinner'

export default function GuestRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-surface">
        <Spinner size="lg" className="text-primary" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
