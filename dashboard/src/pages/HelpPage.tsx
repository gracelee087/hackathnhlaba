import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LifeBuoy, Mail, CirclePlay } from 'lucide-react'
import { PageHeader } from '@/components/ui/misc'
import { Card, SectionHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const DEMO_FLOW = [
  { step: 'Workforce Board öffnen', path: '/workforce', hint: 'Aktive, Austritte, Interviews, gesichertes Wissen, Ausgeschiedene' },
  { step: 'Klaus Becker in „Im KI-Interview“ ziehen', path: '/workforce', hint: 'Oder Button „KI-Interview starten“ auf der Karte' },
  { step: 'Projekt-Interview führen', path: '/expert-knowledge', hint: '„Demo-Antwort einfügen“ + Senden, 5 Fragen zum Vorgehen' },
  { step: 'Plausibilitätsprüfung zeigen', path: '/expert-knowledge', hint: 'Unsichere Aussage (< 60 %) geht automatisch an die Führungskraft' },
  { step: 'Interview abschließen', path: '/expert-knowledge', hint: 'Karte springt auf „Wissen gesichert“' },
  { step: 'Erklärvideo für die Nachfolge erstellen', path: '/content-studio', hint: 'Format Video, Zielrolle ist vorausgewählt' },
  { step: 'In Learning Academy speichern', path: '/content-studio', hint: 'Video ist der Zielrolle zugeordnet' },
  { step: 'Ansicht wechseln: Tim Weber (neu)', path: '/dashboard', hint: 'Profilmenü oben rechts → Ansicht wechseln' },
  { step: 'Onboarding-Dashboard zeigen', path: '/dashboard', hint: 'Nur die für seine Rolle relevanten Videos – inkl. dem neuen' },
  { step: 'Video ansehen & Quiz bestehen', path: '/learning', hint: 'Ab 80 % wird das nächste Kapitel freigeschaltet' },
  { step: 'Als Markus Klein prüfen', path: '/reviews', hint: 'Vier-Augen-Prüfung: Aussage bestätigen, korrigieren oder ablehnen' },
  { step: 'Zurück zu Sarah: Dashboard & Analytics', path: '/dashboard', hint: 'Zahlen und Aktivitäten sind aktualisiert' },
]

const FAQ = [
  { q: 'Woher stammen die KI-Antworten?', a: 'In dieser Hackathon-Version werden alle KI-Funktionen lokal simuliert. Die Architektur trennt UI und KI-Service, sodass später ein echtes Backend angebunden werden kann.' },
  { q: 'Wie werden historische Regelungen erkannt?', a: 'Jeder Wissensartikel besitzt „Gültig ab“ und „Gültig bis“. Abgelaufene Regelungen werden als „Historisch“, ersetzte als „Veraltet“ gekennzeichnet und visuell abgegrenzt.' },
  { q: 'Prüft die KI, ob Mitarbeitende die Wahrheit sagen?', a: 'Nein – bewertet wird die Aussage, nicht die Person. Die KI gleicht sie mit Dokumenten und früheren Antworten ab. Ist sie unsicher (unter 60 %), entscheidet die zuständige Führungskraft im Vier-Augen-Prinzip. Das ist DSGVO-freundlicher und mit dem Betriebsrat leichter abzustimmen.' },
  { q: 'Wann wird ein Kapitel freigeschaltet?', a: 'Sobald das Quiz des vorherigen Kapitels mit mindestens 80 % bestanden wurde. Der Fortschritt wird im Browser (localStorage) gespeichert.' },
  { q: 'Wie setze ich die Demo zurück?', a: 'Über das Profilmenü oben rechts oder unter Settings → „Demo-Daten zurücksetzen“.' },
]

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="space-y-8">
      <PageHeader title="Help & Support" description="Demo-Leitfaden, häufige Fragen und Kontakt." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <SectionHeader icon={CirclePlay} title="End-to-End-Demo in 12 Schritten" description="Empfohlener Ablauf für die Live-Präsentation" />
          <ol className="divide-y divide-border px-5 pb-3 pt-2">
            {DEMO_FLOW.map((d, i) => (
              <li key={d.step} className="flex items-center gap-3 py-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-navy-800 text-[11px] font-semibold text-white">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">{d.step}</p>
                  <p className="text-[12px] text-muted-foreground">{d.hint}</p>
                </div>
                <Link to={d.path} className="text-[12px] font-semibold text-brand hover:underline">Öffnen</Link>
              </li>
            ))}
          </ol>
        </Card>
        <div className="space-y-8">
          <Card>
            <SectionHeader icon={LifeBuoy} title="Häufige Fragen" />
            <div className="p-3">
              {FAQ.map((f, i) => (
                <div key={f.q} className="border-b border-border last:border-0">
                  <button
                    type="button"
                    onClick={() => setOpen(open === i ? null : i)}
                    aria-expanded={open === i}
                    className="flex w-full items-center justify-between gap-3 px-2 py-3 text-left text-[13px] font-medium"
                  >
                    {f.q}
                    <ChevronDown className={cn('size-4 shrink-0 text-slate-400 transition-transform', open === i && 'rotate-180')} />
                  </button>
                  {open === i && <p className="px-2 pb-3 text-[12.5px] leading-relaxed text-muted-foreground">{f.a}</p>}
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionHeader icon={Mail} title="Kontakt" />
            <p className="p-5 pt-3 text-[13px] leading-relaxed text-muted-foreground">
              Team Knowledge Intelligence · Hackathon-Projekt<br />
              Fragen und Feedback gerne direkt am Stand oder im Team-Channel.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
