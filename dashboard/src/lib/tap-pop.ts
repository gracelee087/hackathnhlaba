/**
 * „Aufspringen“ beim Klicken: Jedes klickbare Element (Button, Link, Tab,
 * Karte) federt kurz ein und springt leicht auf. Nutzt die Eigenschaft `scale`,
 * daher keine Konflikte mit Hover-Verschiebungen oder anderen Animationen.
 */
const SELECTOR = 'button, a[href], [role="button"], [role="tab"], [role="menuitem"], [role="option"], summary, label[for]'

export function installTapPop(): () => void {
  if (typeof window === 'undefined') return () => {}
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {}

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    const target = (e.target as Element | null)?.closest<HTMLElement>(SELECTOR)
    if (!target || target.matches(':disabled, [aria-disabled="true"]')) return
    const big = target.offsetWidth > 420 || target.offsetHeight > 220
    const [down, up, settle] = big ? [0.955, 1.045, 0.99] : [0.88, 1.12, 0.97]
    // Web Animations API: läuft zusätzlich zu bestehenden CSS-Animationen, ohne sie neu zu starten
    target.animate?.(
      [
        { scale: '1' },
        { scale: String(down), offset: 0.22 },
        { scale: String(up), offset: 0.5 },
        { scale: String(settle), offset: 0.75 },
        { scale: '1' },
      ],
      { duration: big ? 650 : 600, easing: 'ease-out' },
    )
  }

  document.addEventListener('pointerdown', onDown, { passive: true })
  return () => document.removeEventListener('pointerdown', onDown)
}
