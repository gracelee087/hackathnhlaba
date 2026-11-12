/* ------------------------------------------------------------------
   Browser-Sprachausgabe (Web Speech API) für Podcast und Lernvideo –
   dieselbe Technik wie die Interviewer-Stimme im KI-Interview.
   Kein Backend, keine Dateien: der Browser spricht den Text (de-DE).
------------------------------------------------------------------- */

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

let voicesCache: SpeechSynthesisVoice[] = []

/** Stimmen laden (Chrome liefert sie asynchron) – beim Mount der Player aufrufen. */
export function preloadVoices(): void {
  if (!speechAvailable()) return
  const load = () => {
    const vs = window.speechSynthesis.getVoices()
    if (vs.length) voicesCache = vs
  }
  load()
  window.speechSynthesis.addEventListener?.('voiceschanged', load)
}

function germanVoices(): SpeechSynthesisVoice[] {
  if (!speechAvailable()) return []
  const vs = window.speechSynthesis.getVoices()
  if (vs.length) voicesCache = vs
  const de = voicesCache.filter((v) => v.lang.toLowerCase().startsWith('de'))
  // Lokale Stimmen zuerst (keine Netzabhängigkeit), danach z. B. "Google Deutsch"
  return de.sort((a, b) => Number(b.localService) - Number(a.localService))
}

export interface SpeakerStyle {
  /** Index in der Liste deutscher Stimmen (zwei Sprecher → 0 und 1) */
  voiceIndex?: number
  pitch?: number
  rate?: number
}

let generation = 0

/** Laufende Sprachausgabe abbrechen; offene speak()-Promises lösen sofort auf. */
export function stopSpeaking(): void {
  generation += 1
  if (speechAvailable()) window.speechSynthesis.cancel()
}

// Satzgrenze: Punkt/Frage-/Ausrufezeichen + Großbuchstabe – nicht nach Ziffern („1. Juli“, „v2.“)
const SENTENCE = /(?<=[^\d][.!?])\s+(?=[A-ZÄÖÜ„"(])/

/**
 * Spricht einen Text satzweise (Chrome bricht sehr lange Äußerungen ab) und löst auf,
 * wenn alles gesprochen wurde oder stopSpeaking() aufgerufen wurde.
 */
export async function speak(text: string, style: SpeakerStyle = {}): Promise<void> {
  const clean = (text || '').replace(/\s+/g, ' ').trim()
  if (!speechAvailable() || !clean) return
  const myGen = generation
  const parts = clean.split(SENTENCE).filter(Boolean)
  for (const part of parts) {
    if (myGen !== generation) return
    await speakOne(part, style)
  }
}

function speakOne(text: string, style: SpeakerStyle): Promise<void> {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'de-DE'
    const de = germanVoices()
    if (de.length) u.voice = de[(style.voiceIndex ?? 0) % de.length]
    u.pitch = style.pitch ?? 1
    u.rate = style.rate ?? 1
    let done = false
    const finish = () => {
      if (done) return
      done = true
      window.clearTimeout(guard)
      resolve()
    }
    u.onend = finish
    u.onerror = finish
    // Sicherheitsnetz: falls onend ausbleibt (bekanntes Chrome-Verhalten)
    const guard = window.setTimeout(finish, 3000 + text.length * 150)
    window.speechSynthesis.speak(u)
  })
}

/** Sprecherprofile für den Wissens-Podcast */
export const PODCAST_VOICES: Record<'Anna' | 'Klaus', SpeakerStyle> = {
  Anna: { voiceIndex: 0, pitch: 1.1, rate: 1.0 },
  Klaus: { voiceIndex: 1, pitch: 0.85, rate: 0.95 },
}
