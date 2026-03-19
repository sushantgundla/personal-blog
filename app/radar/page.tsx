import { getAllRadarPosts, getAllRadarPicks } from '@/lib/radar'
import RadarTabs from '@/components/RadarTabs'

export const metadata = {
  title: 'Radar',
  description: 'Real-time signals and focus areas.',
}

export default function RadarPage() {
  const posts = getAllRadarPosts()
  const picks = getAllRadarPicks()

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="animate-fade-up">
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter uppercase">
          AI Radar
        </h1>
        <p className="mt-4 text-on-surface-variant text-lg max-w-2xl">
          Real-time signals, quick thoughts, and curated picks from the AI frontier.
        </p>
      </div>

      <div className="mt-12 animate-fade-up delay-1">
        <RadarTabs posts={posts} picks={picks} />
      </div>
    </section>
  )
}
