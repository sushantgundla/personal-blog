import type { Metadata } from 'next'
import { projects, type ProjectStatus } from '@/lib/projects'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Systems, tools, and experiments from the frontier of AI engineering.',
}

const statusLabels: Record<ProjectStatus, string> = {
  production: 'Production',
  confidential: 'Enterprise / Confidential',
  'open-source': 'Open Source',
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

      {projects.length > 0 ? (
        <section className="animate-fade-up delay-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => {
              const cardContent = (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-label text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">
                      {statusLabels[project.status]}
                    </span>
                  </div>
                  <h3 className="font-headline text-xl font-semibold text-on-surface group-hover:text-primary transition-colors mb-1">
                    {project.title}
                  </h3>
                  <p className="text-primary font-medium text-sm mb-4">
                    {project.organization}
                    <span className="text-on-surface-variant/60"> · {project.period}</span>
                  </p>
                  <p className="text-on-surface-variant text-sm leading-relaxed font-body mb-4">
                    {project.description}
                  </p>
                  {project.impact && (
                    <p className="text-on-surface text-sm font-medium mb-5 border-l-2 border-primary/40 pl-3">
                      {project.impact}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-surface-container-highest text-on-surface-variant border border-outline-variant/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )

              const cardClassName =
                'group rounded-2xl border border-outline-variant/20 bg-surface-container p-8 hover:border-primary/30 hover:bg-surface-container-high hover:shadow-lg hover:shadow-primary/5 transition-all'

              return project.link ? (
                <a
                  key={project.slug}
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardClassName}
                >
                  {cardContent}
                </a>
              ) : (
                <div key={project.slug} className={cardClassName}>
                  {cardContent}
                </div>
              )
            })}
          </div>
        </section>
      ) : (
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
      )}
    </div>
  )
}
