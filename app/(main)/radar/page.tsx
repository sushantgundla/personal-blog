import { getAllRadarPicks, getAllRadarPosts } from '@/lib/radar'
import { Reveal } from '../_components/Reveal'
import { RadarView } from '../_components/RadarView'

export const metadata = {
  title: 'Radar',
  description: 'Signals, notes, and picks from the AI frontier.',
}

/**
 * Radar page. Server component: posts and picks are read from the
 * filesystem here and handed to the view as plain props.
 */
export default function RadarPage() {
  const posts = getAllRadarPosts()
  const picks = getAllRadarPicks()

  return (
    <section id="prism-radar" className="prism-section">
      <div className="prism-wrap">
        <Reveal>
          <span className="prism-eyebrow"><span className="prism-dot" />AI Radar</span>
          <h1 className="prism-title">Radar</h1>
          <p className="prism-body prism-muted" style={{ maxWidth: 640, marginTop: '12px' }}>
            Signals, notes, and picks from the AI frontier.
          </p>
        </Reveal>

        <div style={{ marginTop: 'clamp(28px, 4vh, 48px)' }}>
          <RadarView posts={posts} picks={picks} />
        </div>
      </div>
    </section>
  )
}
