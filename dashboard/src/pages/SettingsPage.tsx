import { useState } from 'react'
import { Check, Cpu, Globe, KeyRound, Minus, RotateCcw, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
import { PageHeader, KeyValue, Avatar } from '@/components/ui/misc'
import { Card, SectionHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NativeSelect, Switch } from '@/components/ui/inputs'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/context/AppContext'
import { AI_MODE } from '@/services/ai-service'
import { ALL_PERMISSIONS, PERMISSION_LABELS, ROLE_LABELS, ROLE_PERMISSIONS } from '@/lib/permissions'
import { USERS } from '@/data/mock-data'
import { cn } from '@/lib/utils'
import type { AppRole } from '@/types'
import { API_BASE_URL, api } from '@/services/api-client'

export default function SettingsPage() {
  const { state, user: currentUser, setCurrentUser, setSidebarCollapsed, resetDemo } = useApp()
  const { toast } = useToast()
  const [notify, setNotify] = useState(true)
  const [digest, setDigest] = useState(false)
  const [language, setLanguage] = useState('de')
  const [resetOpen, setResetOpen] = useState(false)
  const [testing, setTesting] = useState(false)

  const testConnection = async () => {
    setTesting(true)
    try {
      const res = await api.get<{ status?: string }>('/api/health')
      toast({ title: 'Backend erreichbar', description: `Antwort: ${res?.status ?? 'ok'}`, variant: 'success' })
    } catch (e) {
      toast({ title: 'Backend nicht erreichbar', description: e instanceof Error ? e.message : 'Unbekannter Fehler', variant: 'error' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Profil, Präferenzen und Demo-Konfiguration." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader icon={UserRound} title="Profil" description="Verwaltet über das zentrale Identity Management" />
          <div className="flex items-center gap-4 px-5 pt-4">
            <Avatar initials={currentUser.initials} className="size-12 bg-brand text-sm text-white" />
            <div>
              <p className="text-[15px] font-semibold">{currentUser.name}</p>
              <p className="text-[13px] text-muted-foreground">{currentUser.role}</p>
            </div>
          </div>
          <dl className="divide-y divide-border px-5 py-3">
            <KeyValue label="E-Mail">{currentUser.email}</KeyValue>
            <KeyValue label="Abteilung">{currentUser.department}</KeyValue>
            <KeyValue label="Rolle">{ROLE_LABELS[currentUser.appRole]}</KeyValue>
            <KeyValue label="Tätigkeit">{currentUser.jobRole}</KeyValue>
          </dl>
        </Card>

        <Card>
          <SectionHeader icon={Globe} title="Präferenzen" />
          <div className="space-y-4 p-5 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium">Benachrichtigungen im Header</p>
                <p className="text-[12px] text-muted-foreground">Neue Analysen, Interviews und Quizergebnisse</p>
              </div>
              <Switch checked={notify} onCheckedChange={(v) => { setNotify(v); toast({ title: v ? 'Benachrichtigungen aktiviert' : 'Benachrichtigungen deaktiviert' }) }} label="Benachrichtigungen" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium">Wöchentlicher Wissens-Report</p>
                <p className="text-[12px] text-muted-foreground">Zusammenfassung per E-Mail (Demo)</p>
              </div>
              <Switch checked={digest} onCheckedChange={(v) => { setDigest(v); toast({ title: v ? 'Wöchentlicher Report aktiviert' : 'Report deaktiviert' }) }} label="Wöchentlicher Report" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium">Kompakte Seitenleiste</p>
                <p className="text-[12px] text-muted-foreground">Nur Symbole anzeigen</p>
              </div>
              <Switch checked={state.sidebarCollapsed} onCheckedChange={setSidebarCollapsed} label="Kompakte Seitenleiste" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium">Sprache der Lerninhalte</p>
                <p className="text-[12px] text-muted-foreground">Automatische Übersetzung (Roadmap)</p>
              </div>
              <NativeSelect value={language} onChange={(e) => { setLanguage(e.target.value); toast({ title: 'Sprache gespeichert', description: 'Übersetzungen werden in einer späteren Version unterstützt.' }) }} className="w-36" aria-label="Sprache">
                <option value="de">Deutsch</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </NativeSelect>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader icon={Cpu} title="KI-Backend" description="Architektur für spätere Anbindung" />
          <dl className="divide-y divide-border px-5 py-3">
            <KeyValue label="Modus">
              <Badge variant={AI_MODE === 'backend' ? 'success' : 'brand'}>{AI_MODE === 'backend' ? 'Backend verbunden' : 'Simulation (Mock-Service)'}</Badge>
            </KeyValue>
            <KeyValue label="Backend-URL"><code className="text-[12px]">{API_BASE_URL || `${window.location.origin}/api (Proxy)`}</code></KeyValue>
            <KeyValue label="Fallback auf Simulation">{import.meta.env.VITE_AI_FALLBACK === 'false' ? 'Aus' : 'An'}</KeyValue>
            <KeyValue label="Konfiguration"><code className="text-[12px]">.env → VITE_AI_MODE</code></KeyValue>
          </dl>
          <div className="flex flex-wrap items-center gap-3 px-5 pb-5">
            <Button variant="outline" size="sm" onClick={testConnection} disabled={testing}>
              {testing ? 'Teste …' : 'Verbindung testen'}
            </Button>
            <p className="text-[12px] text-muted-foreground">Endpunkte und JSON-Formate: siehe <code>API.md</code></p>
          </div>
        </Card>

        <Card>
          <SectionHeader icon={ShieldCheck} title="Datenschutz & Berechtigungen" />
          <ul className="space-y-2.5 p-5 pt-4 text-[13px]">
            {[
              'Verarbeitung nur von Inhalten mit Freigabe und Nutzungsrecht',
              'Rollenbasierte Sichtbarkeit von Wissensartikeln',
              'Protokollierung aller Änderungen in der Versionshistorie',
              'Keine Kundendaten in der Demo-Umgebung',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2"><KeyRound className="mt-0.5 size-3.5 shrink-0 text-success" /> {t}</li>
            ))}
          </ul>
          <div className="border-t border-border px-5 py-4">
            <Button variant="outline" onClick={() => setResetOpen(true)}>
              <RotateCcw /> Demo-Daten zurücksetzen
            </Button>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <SectionHeader icon={UsersRound} title="Rollen & Berechtigungen" description="Wer welche Informationen sehen darf – Klick auf eine Rolle wechselt die Ansicht (Demo)" />
          <div className="mt-4 overflow-x-auto border-t border-border scrollbar-thin">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">Berechtigung</th>
                  {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => {
                    const u = USERS.find((x) => x.appRole === r)
                    return (
                      <th key={r} className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => u && setCurrentUser(u.id)}
                          className={cn(
                            'rounded-md px-2 py-1 text-[12px] font-semibold transition-colors',
                            currentUser.appRole === r ? 'bg-navy-800 text-white' : 'text-slate-600 hover:bg-slate-100',
                          )}
                        >
                          {ROLE_LABELS[r]}
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {ALL_PERMISSIONS.map((perm) => (
                  <tr key={perm} className="border-t border-border">
                    <td className="px-4 py-2.5">{PERMISSION_LABELS[perm]}</td>
                    {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                      <td key={r} className={cn('px-3 py-2.5 text-center', currentUser.appRole === r && 'bg-navy-50/60')}>
                        {ROLE_PERMISSIONS[r].includes(perm) ? (
                          <Check className="mx-auto size-4 text-success" aria-label="erlaubt" />
                        ) : (
                          <Minus className="mx-auto size-4 text-slate-300" aria-label="nicht erlaubt" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-5 py-3 text-[12px] text-muted-foreground">
            Teamleitungen sehen im Workforce Board nur ihre eigene Abteilung. Austrittsgründe sind vertraulich und nur für HR und Knowledge Management sichtbar.
          </p>
        </Card>
      </div>

      <Dialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Demo-Daten zurücksetzen?"
        description="Alle in dieser Demo erstellten Inhalte und Lernfortschritte werden gelöscht."
        footer={
          <>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={() => { resetDemo(); setResetOpen(false); toast({ title: 'Demo zurückgesetzt', variant: 'success' }) }}>Zurücksetzen</Button>
          </>
        }
      />
    </div>
  )
}
