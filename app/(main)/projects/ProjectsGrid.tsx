'use client'

import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import Link from 'next/link'
import type { Project, ProjectStatus } from '@/lib/projects'
import { Reveal } from '../_components/Reveal'

type Filter = 'all' | ProjectStatus

const STATUS_LABEL: Record<ProjectStatus, string> = {
  production: 'Production',
  confidential: 'Enterprise / Confidential',
  'open-source': 'Open Source',
  experiment: 'Experiments',
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'production', label: 'Production' },
  { value: 'open-source', label: 'Open Source' },
  { value: 'confidential', label: 'Confidential' },
  { value: 'experiment', label: 'Experiments' },
]

interface ProjectCardProps {
  project: Project
  dimmed: boolean
  delay: number
}

function ProjectCard({ project, dimmed, delay }: ProjectCardProps): JSX.Element {
  const card = (
    <div
      className={project.link ? 'prism-card prism-card-lift prism-col' : 'prism-card prism-col'}
      style={{
        height: '100%',
        justifyContent: 'space-between',
        gap: '0.6rem',
        paddingBlock: 'clamp(18px, 2.6vw, 26px)',
        opacity: dimmed ? 0.35 : 1,
        transform: dimmed ? 'scale(0.97)' : 'scale(1)',
        transition: 'opacity var(--prism-dur) var(--prism-ease), transform var(--prism-dur) var(--prism-ease)',
      }}
    >
      <div className="prism-col" style={{ gap: '0.6rem' }}>
        <div
          className="prism-col"
          style={{ alignItems: 'flex-start', gap: '10px' }}
        >
          {/* Badge above the title on its own line, not beside it.
              "Enterprise / Confidential" is far too long to share a row: with
              flexWrap: nowrap it pushed out past the card edge, and it squeezed
              the title into the left half while the right sat empty. Stacking
              gives the title the full width and keeps the badge inside. */}
          <span className="prism-badge">{STATUS_LABEL[project.status]}</span>
          <span className="prism-sub" style={{ fontWeight: 700 }}>
            {project.title}
          </span>
        </div>
        <span className="prism-mono prism-muted" style={{ fontSize: '0.85em' }}>
          {project.organization} · {project.period}
        </span>
        <p className="prism-body prism-muted" style={{ margin: 0 }}>
          {project.description}
        </p>
        {project.impact && (
          <p className="prism-body" style={{ margin: 0, color: 'var(--prism-accent)', fontWeight: 600 }}>
            {project.impact}
          </p>
        )}
      </div>
      <div className="prism-row" style={{ gap: '8px', marginTop: '10px' }}>
        {project.tags.map((tag) => (
          <span key={tag} className="prism-chip">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <Reveal delay={delay}>
      {project.link ? (
        <Link href={project.link} style={{ display: 'block', height: '100%', textDecoration: 'none', color: 'inherit' }}>
          {card}
        </Link>
      ) : (
        card
      )}
    </Reveal>
  )
}

export function ProjectsGrid({ projects }: { projects: Project[] }): JSX.Element {
  const [filter, setFilter] = useState<Filter>('all')

  // Experiments are personal, curiosity-built projects — kept out of the
  // work grid and shown as their own group underneath, not mixed in.
  const workProjects = useMemo(() => projects.filter((p) => p.status !== 'experiment'), [projects])
  const experimentProjects = useMemo(() => projects.filter((p) => p.status === 'experiment'), [projects])

  const visibleCount = useMemo(() => {
    if (filter === 'all') return projects.length
    return projects.filter((p) => p.status === filter).length
  }, [projects, filter])

  const countLabel =
    filter === 'all'
      ? `${projects.length} system${projects.length === 1 ? '' : 's'}`
      : `${visibleCount} ${STATUS_LABEL[filter].toLowerCase()} system${visibleCount === 1 ? '' : 's'}`

  return (
    <>
      <Reveal>
        <div
          className="prism-row"
          style={{ justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '28px' }}
        >
          <span className="prism-mono prism-muted">{countLabel}</span>
          <div className="prism-row" role="group" aria-label="Filter projects by status" style={{ gap: '4px', flexWrap: 'wrap' }}>
            {FILTERS.map((f) => {
              const pressed = filter === f.value
              return (
                <button
                  key={f.value}
                  type="button"
                  className="prism-btn-quiet"
                  aria-pressed={pressed}
                  onClick={() => setFilter(f.value)}
                  style={{
                    color: pressed ? 'var(--prism-text)' : undefined,
                    borderColor: pressed ? 'var(--prism-accent)' : undefined,
                  }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>
      </Reveal>

      <div className="prism-grid" data-cols="2">
        {workProjects.map((project, i) => (
          <ProjectCard
            key={project.slug}
            project={project}
            dimmed={filter !== 'all' && project.status !== filter}
            delay={Math.min(i, 6) * 60}
          />
        ))}
      </div>

      {experimentProjects.length > 0 && (
        <div style={{ marginTop: 'clamp(32px, 4vh, 48px)' }}>
          <Reveal>
            <div className="prism-row" style={{ alignItems: 'baseline', gap: '12px', marginBottom: '18px' }}>
              <span className="prism-eyebrow">Experiments</span>
              <span className="prism-mono prism-muted" style={{ fontSize: '0.85em' }}>
                Built out of curiosity, not for work
              </span>
            </div>
          </Reveal>
          <div className="prism-grid" data-cols="2">
            {experimentProjects.map((project, i) => (
              <ProjectCard
                key={project.slug}
                project={project}
                dimmed={filter !== 'all' && project.status !== filter}
                delay={Math.min(workProjects.length + i, 6) * 60}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default ProjectsGrid
