import PageWrapper from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'
import { useAuth } from '../../hooks/useAuth'



import { Sparkles, Layers, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <PageWrapper
      title={`Welcome back, ${user?.name || 'Developer'} 👋`}
      subtitle="Here is an overview of your career growth and skill progression."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Skill Inventory" subtitle="Track and level up your skills">
          <p className="text-sm text-text-muted mb-4">
            Manage your verified skills and target proficiencies.
          </p>
          <Link to="/skills">
            <Button variant="secondary" size="sm" icon={Layers}>
              Go to Skills
            </Button>
          </Link>
        </Card>

        <Card title="AI Gap Analysis" subtitle="Role-tailored recommendations">
          <p className="text-sm text-text-muted mb-4">
            Compare your profile against {user?.target_role || 'target roles'}.
          </p>
          <Link to="/ai-insights">
            <Button variant="primary" size="sm" icon={Sparkles}>
              Run Analysis
            </Button>
          </Link>
        </Card>

        <Card title="Upcoming Events" subtitle="Conferences & Hackathons">
          <p className="text-sm text-text-muted mb-4">
            Discover community events matching your tech stack.
          </p>
          <Link to="/events">
            <Button variant="secondary" size="sm" icon={Calendar}>
              Browse Events
            </Button>
          </Link>
        </Card>
      </div>
    </PageWrapper>
  )
}
