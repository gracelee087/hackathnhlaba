import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Card>
      <EmptyState
        className="py-20"
        icon={Compass}
        title="Seite nicht gefunden"
        description="Die angeforderte Seite existiert nicht."
        action={<Button onClick={() => navigate('/dashboard')}><ArrowLeft /> Zum Dashboard</Button>}
      />
    </Card>
  )
}
