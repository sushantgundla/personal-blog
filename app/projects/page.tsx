import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Systems, tools, and experiments from the frontier of AI engineering.',
}

export default function ProjectsPage() {
  return (
    <div>
      {/* Header */}
      <section className="mb-12 animate-fade-up">
        <h1 className="font-headline text-6xl md:text-7xl font-bold tracking-tighter text-on-surface mb-4">
          Systems &{' '}
          <span className="text-primary">Prototypes</span>
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl">
          Systems, tools, and experiments from the frontier of AI engineering.
        </p>
      </section>

      {/* Empty state */}
      <section className="animate-fade-up delay-1">
        <div className="flex flex-col items-center justify-center py-32 rounded-2xl border border-dashed border-outline-variant/30">
          <div className="text-6xl mb-6">🧪</div>
          <p className="font-headline text-2xl font-bold text-on-surface mb-2">
            Still cooking.
          </p>
          <p className="text-on-surface-variant text-sm max-w-md text-center leading-relaxed">
            The agents are running experiments, the GPU is warm, and the commits are piling up.
            Projects will appear here once they escape the lab.
          </p>
          <div className="mt-8 flex items-center gap-2 text-on-surface-variant/40 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>experiments_in_progress: true</span>
          </div>
        </div>
      </section>
    </div>
  )
}
