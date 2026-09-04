import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-surface text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-card border border-border flex items-center justify-center mb-6 text-2xl font-bold text-primary">
        404
      </div>
      <h1 className="text-3xl font-bold text-text mb-2">Page Not Found</h1>
      <p className="text-text-muted text-sm max-w-sm mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" icon={Home}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  )
}
