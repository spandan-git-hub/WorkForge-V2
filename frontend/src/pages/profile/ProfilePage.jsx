import PageWrapper from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'
import { useAuth } from '../../hooks/useAuth'


export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <PageWrapper
      title="User Profile"
      subtitle="Manage your personal details and target role."
    >
      <Card title="Profile Details">
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-text-muted">Name: </span>
            <span className="text-text font-medium">{user?.name}</span>
          </div>
          <div>
            <span className="text-text-muted">Email: </span>
            <span className="text-text font-medium">{user?.email}</span>
          </div>
          <div>
            <span className="text-text-muted">Target Role: </span>
            <span className="text-text font-medium">{user?.target_role || 'Not set'}</span>
          </div>
        </div>
      </Card>
    </PageWrapper>
  )
}
