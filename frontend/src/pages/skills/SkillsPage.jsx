import PageWrapper from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'

export default function SkillsPage() {
  return (
    <PageWrapper
      title="Skill Inventory"
      subtitle="Manage and rate your technical proficiency."
    >
      <Card title="Your Skills">
        <p className="text-sm text-text-muted">Skills management will be available in Phase 5.</p>
      </Card>
    </PageWrapper>
  )
}
