import type { InterviewScriptId } from '@/types'

/**
 * Gesprächsleitfäden der simulierten Interview-KI.
 * Ein echtes LLM-Backend würde diese Struktur dynamisch erzeugen.
 */
export interface ScriptStep {
  /** Vorschlag für die Expertenantwort (Demo-Hilfe für Präsentationen) */
  suggestion: string
  /** Rückfrage der KI nach der Antwort */
  reply: string
  topicId: string
  resolve: string[]
  contradiction?: { text: string; severity: 'hoch' | 'mittel' }
  resolveContradictions?: boolean
  followUp?: string
  finished?: boolean
}

export interface IntroContext {
  expertName: string
  documentName?: string
  projectName?: string
  exitDate?: string
}

export interface InterviewScript {
  id: InterviewScriptId
  label: string
  intro: (ctx: IntroContext) => string[]
  topics: { id: string; label: string }[]
  missing: { id: string; label: string }[]
  steps: ScriptStep[]
}

export const INTERVIEW_SCRIPTS: Record<InterviewScriptId, InterviewScript> = {
  historisch: {
    id: 'historisch',
    label: 'Historische Bausparverträge & Tarifgenerationen',
    intro: ({ expertName: expert, documentName: doc }) => [
      `Guten Tag, ${expert}. Ich habe vorab ${doc ? `das Dokument „${doc}“` : 'die vorhandenen Tarifunterlagen'} analysiert und Hinweise auf abweichende Bedingungen bei historischen Bausparverträgen gefunden. Diese Punkte möchte ich gerne mit Ihnen vertiefen.`,
      'Sie haben erwähnt, dass historische Bausparverträge teilweise anderen Tarifbedingungen unterliegen. Können Sie erläutern, welche Unterschiede bei der Bearbeitung besonders relevant sind?',
    ],
    topics: [
      { id: 't1', label: 'Unterschiede bei Altverträgen' },
      { id: 't2', label: 'Tarifgenerationen & Ausnahmen' },
      { id: 't3', label: 'Gültigkeit für Bestandsverträge' },
      { id: 't4', label: 'Typische Bearbeitungsfehler' },
      { id: 't5', label: 'Prüfroutine & Ansprechpartner' },
    ],
    missing: [
      { id: 'm1', label: 'Relevante Unterschiede in der Bearbeitung' },
      { id: 'm2', label: 'Betroffene Tarifgenerationen' },
      { id: 'm3', label: 'Ausnahmen und Sonderfälle' },
      { id: 'm4', label: 'Gültigkeit für Bestandsverträge nach 2015' },
      { id: 'm5', label: 'Typische Bearbeitungsfehler' },
      { id: 'm6', label: 'Prüfroutine und Ansprechpartner' },
    ],
    steps: [
      {
        suggestion: 'Bei älteren Verträgen müssen wir insbesondere die damaligen Tarifbedingungen berücksichtigen.',
        reply: 'Welche konkreten Tarifgenerationen sind davon betroffen? Gibt es Ausnahmen?',
        topicId: 't1',
        resolve: ['m1'],
      },
      {
        suggestion:
          'Betroffen sind vor allem Verträge der Generation A und Classic 2004. Ausnahme sind Verträge, die nach 2010 auf den Vario-Tarif umgestellt wurden – dort gelten ab Umstellung die neuen Bedingungen. Die Classic-Bedingungen wenden wir bis heute an.',
        reply:
          'Danke, das ist sehr präzise. Mir fällt ein möglicher Widerspruch auf: Laut Rundschreiben RS 07/2015 endete die Gültigkeit der Classic-Bedingungen am 31.12.2015 – Sie beschreiben, dass sie weiterhin angewendet werden. Gilt das Rundschreiben auch für Bestandsverträge?',
        topicId: 't2',
        resolve: ['m2', 'm3'],
        contradiction: {
          text: 'RS 07/2015 nennt den 31.12.2015 als Gültigkeitsende der Classic-Bedingungen – laut Expertenaussage werden sie weiterhin angewendet.',
          severity: 'hoch',
        },
      },
      {
        suggestion:
          'Das Rundschreiben betrifft nur Neuabschlüsse. Für Bestandsverträge bleiben die Classic-Bedingungen bis zum Vertragsende maßgeblich.',
        reply:
          'Verstanden – ich trenne die Gültigkeit sauber: Neuabschlüsse bis 31.12.2015 (historisch), Bestandsverträge bis Vertragsende (aktuell anzuwenden). Welche typischen Fehler treten bei der Bearbeitung solcher Altverträge auf, etwa bei Zinsen oder Gebühren?',
        topicId: 't3',
        resolve: ['m4'],
        resolveContradictions: true,
      },
      {
        suggestion:
          'Häufig wird der Guthabenzins nach dem aktuellen Tarif statt nach dem Vertragstarif berechnet. Außerdem wird die Erstattung der Abschlussgebühr bei Darlehensverzicht oft vergessen.',
        reply: 'Sehr wertvoll. Gibt es dafür eine dokumentierte Prüfroutine oder feste Ansprechpersonen bei Unklarheiten?',
        topicId: 't4',
        resolve: ['m5'],
      },
      {
        suggestion:
          'Eine formale Prüfroutine gibt es nicht. Wir arbeiten mit einer Checkliste im Team-SharePoint, Ansprechpartner ist das Team Bestandsverwaltung.',
        reply:
          'Vielen Dank – damit sind alle Kernthemen erfasst. Hinweis: Die Prüfroutine ist bisher nicht formal dokumentiert; ich habe das als offenen Punkt markiert. Bitte validieren Sie die extrahierten Aussagen und speichern Sie das Wissen in der Knowledge Base.',
        topicId: 't5',
        resolve: ['m6'],
        followUp: 'Formale Prüfroutine für Altverträge dokumentieren und Verantwortung klären',
        finished: true,
      },
    ],
  },
  projekt: {
    id: 'projekt',
    label: 'Projektwissen vor dem Austritt',
    intro: ({ expertName, projectName, exitDate }) => [
      `Guten Tag, ${expertName}. ${exitDate ? `Sie verlassen die Helaba zum ${exitDate}. ` : ''}Ich möchte mit Ihnen festhalten, wie Sie Ihre Projekte umgesetzt haben – daraus entstehen Erklärvideos für die Einarbeitung Ihrer Nachfolge.`,
      `Beginnen wir mit Ihrem wichtigsten Projekt${projectName ? ` „${projectName}“` : ''}: Was war das Ziel, und wie sind Sie dabei vorgegangen?`,
    ],
    topics: [
      { id: 'p1', label: 'Ziel & Vorgehen' },
      { id: 'p2', label: 'Werkzeuge & Datenquellen' },
      { id: 'p3', label: 'Arbeitsschritte & Entscheidungen' },
      { id: 'p4', label: 'Stolperfallen' },
      { id: 'p5', label: 'Übergabe & Einarbeitung' },
    ],
    missing: [
      { id: 'pm1', label: 'Ziel und Vorgehen im Projekt' },
      { id: 'pm2', label: 'Genutzte Systeme und Ablageorte' },
      { id: 'pm3', label: 'Wiederkehrende Arbeitsschritte' },
      { id: 'pm4', label: 'Erfahrungsbasierte Entscheidungen' },
      { id: 'pm5', label: 'Typische Fehler und Stolperfallen' },
      { id: 'pm6', label: 'Lernziele für die Nachfolge' },
    ],
    steps: [
      {
        suggestion: 'Ziel war, die Prüfung von Altverträgen schneller und fehlerfreier zu machen. Ich habe zuerst alle Tarifgenerationen in einer Prüfmatrix erfasst und daraus eine Schritt-für-Schritt-Checkliste gebaut.',
        reply: 'Sehr anschaulich. Welche Werkzeuge, Systeme und Datenquellen haben Sie dafür genutzt – und wo liegen diese heute?',
        topicId: 'p1',
        resolve: ['pm1'],
      },
      {
        suggestion: 'Die Prüfmatrix liegt im Team-SharePoint, die Vertragsdaten kommen aus dem Bestandssystem. Für Sonderfälle ziehe ich Auswertungen aus dem Data Warehouse.',
        reply: 'Danke. Welche Schritte machen Sie jedes Mal gleich – und welche Entscheidungen treffen Sie eher aus Erfahrung?',
        topicId: 'p2',
        resolve: ['pm2'],
      },
      {
        suggestion: 'Immer gleich: Vertrag aufrufen, Tarifgeneration bestimmen, Checkliste abarbeiten. Aus Erfahrung entscheide ich, wann ein Fall an die Rechtsabteilung geht – nur bei Tarifumstellungen vor 2010.',
        reply: 'Mir fällt ein möglicher Widerspruch auf: Laut Prozesshandbuch gehen alle Tarifumstellungen an die Rechtsabteilung – Sie nennen nur Fälle vor 2010. Was gilt heute?',
        topicId: 'p3',
        resolve: ['pm3', 'pm4'],
        contradiction: { text: 'Prozesshandbuch: alle Tarifumstellungen an die Rechtsabteilung – Expertenaussage: nur Umstellungen vor 2010.', severity: 'hoch' },
      },
      {
        suggestion: 'Das Handbuch ist an der Stelle veraltet – seit 2022 prüfen wir Fälle ab 2010 selbst. Die häufigste Stolperfalle ist ein falsch berechneter Guthabenzins bei Altverträgen.',
        reply: 'Verstanden, ich markiere die Handbuch-Regel als veraltet. Was sollte Ihre Nachfolge in der ersten Woche lernen, um das Projekt sicher weiterzuführen?',
        topicId: 'p4',
        resolve: ['pm5'],
        resolveContradictions: true,
      },
      {
        suggestion: 'In der ersten Woche: die Tarifgenerationen verstehen, die Checkliste an drei echten Fällen anwenden und Sonderfälle für die Rechtsabteilung erkennen.',
        reply: 'Vielen Dank! Ich habe alle Kernthemen erfasst. Aus Ihren Antworten kann jetzt ein Erklärvideo für die Einarbeitung Ihrer Nachfolge erstellt werden. Bitte validieren Sie die Aussagen und schließen Sie das Interview ab.',
        topicId: 'p5',
        resolve: ['pm6'],
        followUp: 'Erklärvideo für die Nachfolge erstellen',
        finished: true,
      },
    ],
  },
  generisch: {
    id: 'generisch',
    label: 'Allgemeines Erfahrungswissen',
    intro: ({ expertName: expert, documentName: doc }) => [
      `Guten Tag, ${expert}. Ich unterstütze Sie dabei, Ihr Erfahrungswissen strukturiert zu sichern${doc ? ` – als Grundlage dient das Dokument „${doc}“` : ''}.`,
      'Welche Sonderfälle treten in Ihrem Bereich regelmäßig auf, die in den offiziellen Unterlagen nicht beschrieben sind?',
    ],
    topics: [
      { id: 'g1', label: 'Sonderfälle' },
      { id: 'g2', label: 'Quellen & Aktualität' },
      { id: 'g3', label: 'Historische Regelungen' },
      { id: 'g4', label: 'Typische Fehler' },
      { id: 'g5', label: 'Ansprechpartner' },
    ],
    missing: [
      { id: 'gm1', label: 'Nicht dokumentierte Sonderfälle' },
      { id: 'gm2', label: 'Genutzte Quellen und deren Aktualität' },
      { id: 'gm3', label: 'Abgrenzung historisch / aktuell' },
      { id: 'gm4', label: 'Typische Fehler von Einsteiger:innen' },
      { id: 'gm5', label: 'Ansprechpartner und Vertretung' },
    ],
    steps: [
      {
        suggestion: 'Regelmäßig haben wir Sonderfälle bei Vertragsübertragungen und Teilauszahlungen, die nicht im Handbuch beschrieben sind.',
        reply: 'Danke. Welche Dokumente oder Systeme nutzen Sie für diese Sonderfälle, und sind diese noch aktuell?',
        topicId: 'g1',
        resolve: ['gm1'],
      },
      {
        suggestion: 'Wir nutzen das Prozesshandbuch von 2019 und eigene Notizen. Das Handbuch ist in Teilen veraltet.',
        reply:
          'Mir fällt auf: Das Prozesshandbuch 2019 ist als gültige Quelle hinterlegt, Sie beschreiben es als teilweise veraltet. Welche Abschnitte betrifft das?',
        topicId: 'g2',
        resolve: ['gm2'],
        contradiction: { text: 'Prozesshandbuch 2019 ist als gültig hinterlegt, wird aber als teilweise veraltet beschrieben.', severity: 'mittel' },
      },
      {
        suggestion: 'Vor allem die Abschnitte zu Fristen und Freigaben – die wurden 2023 durch eine interne Weisung ersetzt.',
        reply: 'Verstanden, ich markiere diese Abschnitte als historisch. Welche Fehler sehen Sie bei neuen Kolleginnen und Kollegen am häufigsten?',
        topicId: 'g3',
        resolve: ['gm3'],
        resolveContradictions: true,
      },
      {
        suggestion: 'Am häufigsten werden Fristen nach der alten Regel berechnet und Freigaben nicht dokumentiert.',
        reply: 'Wen sollte man bei Unklarheiten ansprechen, und gibt es eine Vertretung?',
        topicId: 'g4',
        resolve: ['gm4'],
      },
      {
        suggestion: 'Ansprechpartner ist die Fachgruppe Prozesse, die Vertretung übernimmt die Teamleitung.',
        reply: 'Vielen Dank – alle Kernthemen sind erfasst. Bitte validieren Sie die Aussagen und speichern Sie das Wissen in der Knowledge Base.',
        topicId: 'g5',
        resolve: ['gm5'],
        followUp: 'Interne Weisung 2023 in Document Intelligence hochladen',
        finished: true,
      },
    ],
  },
}
