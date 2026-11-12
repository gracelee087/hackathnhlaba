import type * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'
import { useApp } from '@/context/AppContext'
import { PERMISSION_LABELS, ROLE_LABELS, type Permission } from '@/lib/permissions'

/** Schützt eine Seite: Ohne passende Berechtigung erscheint ein Hinweis statt des Inhalts. */
export function RequirePermission({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { can, user } = useApp()
  const navigate = useNavigate()
  if (can(permission)) return <>{children}</>
  return (
    <Card>
      <EmptyState
        className="py-20"
        icon={Lock}
        title="Kein Zugriff"
        description={`Ihre Rolle „${ROLE_LABELS[user.appRole]}“ hat keine Berechtigung: ${PERMISSION_LABELS[permission]}.`}
        action={
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft /> Zum Dashboard
          </Button>
        }
      />
    </Card>
  )
}
