import { getAllRadarPosts, getAllRadarPicks } from '@/lib/radar'
import { RadarTabs } from '@/components/RadarTabs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Radar',
  description: 'Quick thoughts, observations, and things I recommend.',
}

export default function RadarPage() {
  const posts = getAllRadarPosts()
  const picks = getAllRadarPicks()

  return (
    <div>
      <section className="mb-8 animate-fade-up">
        <h1
          className="text-[30px] font-bold tracking-tight text-[var(--text-primary)] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Radar
        </h1>
        <p className="text-[15px] text-[var(--text-muted)]">
          Quick thoughts, observations, and things I recommend.
        </p>
      </section>

      <RadarTabs posts={posts} picks={picks} />
    </div>
  )
}
