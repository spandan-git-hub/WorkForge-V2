import PageWrapper from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'

export default function EventsPage() {
  return (
    <PageWrapper
      title="Tech Events"
      subtitle="Discover hackathons, conferences, and meetups."
    >
      <Card title="Upcoming Events">
        <p className="text-sm text-text-muted">Events tracking will be active in Phase 6.</p>
      </Card>
    </PageWrapper>
  )
}
