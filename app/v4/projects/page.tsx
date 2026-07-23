import type { Metadata } from 'next'
import Link from 'next/link'
import { projects, type ProjectStatus } from '@/lib/projects'
import { Reveal } from '../_components/Reveal'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Systems, tools, and experiments from the frontier of AI engineering.',
}

const statusLabels: Record<ProjectStatus, string> = {
  production: 'Production',
  confidential: 'Enterprise / Confidential',
  'open-source': 'Open Source',
}

const statusOrder: ProjectStatus[] = ['production', 'confidential', 'open-source']

export default function V4Projects() {
  const groups = statusOrder
    .map((status) => ({ status, items: projects.filter((p) => p.status === status) }))
    .filter((g) => g.items.length > 0)

  let rowIndex = 0

  return (
    <div>
      <section className="mx-auto max-w-6xl px-5 md:px-8 pt-16 md:pt-24 pb-12 md:pb-16">
        <Reveal>
          <h1 className="v4-display font-black tracking-tight text-on-surface text-4xl md:text-6xl leading-[1.05]">
            Projects
          </h1>
        </Reveal>
        <Reveal delay={80}>
          <p className="text-on-surface-variant text-lg mt-5 max-w-2xl">
            Systems, tools, and experiments from the frontier of AI engineering.
          </p>
        </Reveal>
      </section>

      {groups.map((group) => (
        <section
          key={group.status}
          className="mx-auto max-w-6xl px-5 md:px-8 py-10 md:py-14 border-t border-outline-variant/60"
        >
          <Reveal>
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
              {statusLabels[group.status]}
            </span>
          </Reveal>

          <div className="mt-6">
            {group.items.map((project) => {
              const delay = (rowIndex++ % 4) * 60
              const isArticleLink = project.link?.startsWith('/articles')
              const isExternal = !!project.link && !project.link.startsWith('/')
              const href = project.link
                ? project.link.startsWith('/')
                  ? `/v4${project.link}`
                  : project.link
                : undefined

              return (
                <Reveal key={project.slug} delay={delay}>
                  <div className="group border-t border-outline-variant/60 py-10 md:py-12 first:border-t-0 first:pt-0">
                    <h3 className="v4-display font-bold tracking-tight text-2xl md:text-3xl leading-[1.1] text-on-surface group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-sm md:text-base">
                      <span className="text-primary">{project.organization}</span>
                      <span className="text-on-surface-variant"> · {project.period}</span>
                    </p>
                    <p className="text-on-surface-variant mt-4 max-w-2xl leading-relaxed">
                      {project.description}
                    </p>
                    {project.impact && (
                      <p className="mt-4 max-w-2xl border-l-2 border-primary/50 pl-3 text-sm md:text-base text-on-surface">
                        {project.impact}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-5">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="border border-outline-variant rounded-full px-2.5 py-1 text-xs text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {href &&
                      (isExternal ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-5 font-mono text-xs uppercase tracking-widest text-primary group-hover:opacity-80 transition-opacity"
                        >
                          {isArticleLink ? 'Read the deep dive' : 'View project'}
                          <span aria-hidden="true" className="motion-safe:group-hover:translate-x-1 transition-transform">→</span>
                        </a>
                      ) : (
                        <Link
                          href={href}
                          className="inline-flex items-center gap-1.5 mt-5 font-mono text-xs uppercase tracking-widest text-primary group-hover:opacity-80 transition-opacity"
                        >
                          {isArticleLink ? 'Read the deep dive' : 'View project'}
                          <span aria-hidden="true" className="motion-safe:group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                      ))}
                  </div>
                </Reveal>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
