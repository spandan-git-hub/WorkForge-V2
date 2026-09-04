import { useParams, Link } from 'react-router-dom'
import PageWrapper from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { ArrowLeft } from 'lucide-react'

export default function EventDetailPage() {
  const { id } = useParams()

  return (
    <PageWrapper
      title="Event Details"
      action={
        <Link to="/events">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Back to Events
          </Button>
        </Link>
      }
    >
      <Card title={`Event #${id}`}>
        <p className="text-sm text-text-muted">Event details view will be active in Phase 6.</p>
      </Card>
    </PageWrapper>
  )
}
