/**
 * Slow infinite skills marquee. Pure CSS (transform + animation, no JS) so
 * it costs nothing on the server. Pauses on hover via v4.css; collapses to
 * a static, fully-visible strip under prefers-reduced-motion.
 */
export function Marquee({ items }: { items: string[] }) {
  const Set = ({ hidden }: { hidden?: boolean }) => (
    <div className="v4-marquee-set" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <span className="v4-marquee-item" key={i}>
          {item}
          <span className="v4-marquee-dot" aria-hidden="true">•</span>
        </span>
      ))}
    </div>
  )

  return (
    <div className="v4-marquee">
      <div className="v4-marquee-track">
        <Set />
        <Set hidden />
      </div>
    </div>
  )
}
