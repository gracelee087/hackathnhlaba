/** Futuristische Farbflächen für Video- und Kursvorschauen – rotieren nach Index. */
export const THUMB_TONES = [
  'bg-[radial-gradient(120%_120%_at_100%_0%,#24507d_0%,#0f2742_45%,#050d1a_100%)]',
  'bg-[radial-gradient(120%_120%_at_100%_0%,#0a6cff_0%,#173a5e_50%,#0a1a2f_100%)]',
  'bg-[radial-gradient(120%_120%_at_100%_0%,#2bb38a_0%,#0f4a4a_50%,#0a1a2f_100%)]',
  'bg-[radial-gradient(120%_120%_at_100%_0%,#ff5a63_0%,#5a0f2a_45%,#0a1a2f_100%)]',
  'bg-[radial-gradient(120%_120%_at_100%_0%,#8a98ad_0%,#2c3a50_50%,#0a1a2f_100%)]',
]

export function thumbTone(index: number) {
  return THUMB_TONES[Math.abs(index) % THUMB_TONES.length]
}
