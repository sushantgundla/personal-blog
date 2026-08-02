'use client'

import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import Link from 'next/link'
import type { Project, ProjectStatus } from '@/lib/projects'
import { Reveal } from '../_components/Reveal'

type Filter = 'all' | ProjectStatus

const STATUS_LABEL: Record<ProjectStatus, string> = {
  production: 'Production',
  confidential: 'Confidential',
  'open-source': 'Open Source',
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'production', label: 'Production' },
  { value: 'open-source', label: 'Open Source' },
  { value: 'confidential', label: 'Confidential' },
]

interface ProjectCardProps {
  project: Project
  dimmed: boolean
  delay: number
}

function ProjectCard({ project, dimmed, delay }: ProjectCardProps): JSX.Element {
  const card = (
    <div
      className={project.link ? 'v2-card v2-card-lift v2-col' : 'v2-card v2-col'}
      style={{
        height: '100%',
        justifyContent: 'space-between',
        gap: '0.6rem',
        paddingBlock: 'clamp(18px, 2.6vw, 26px)',
        opacity: dimmed ? 0.35 : 1,
        transform: dimmed ? 'scale(0.97)' : 'scale(1)',
        transition: 'opacity var(--v2-dur) var(--v2-ease), transform var(--v2-dur) var(--v2-ease)',
      }}
    >
      <div className="v2-col" style={{ gap: '0.6rem' }}>
        <div
          className="v2-row"
          style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap', gap: '10px' }}
        >
          <span className="v2-sub" style={{ fontWeight: 700 }}>
            {project.title}
          </span>
          <span className="v2-badge" style={{ flexShrink: 0 }}>
            {STATUS_LABEL[project.status]}
          </span>
        </div>
        <span className="v2-mono v2-muted" style={{ fontSize: '0.85em' }}>
          {project.organization} · {project.period}
        </span>
        <p className="v2-body v2-muted" style={{ margin: 0 }}>
          {project.description}
        </p>
        {project.impact && (
          <p className="v2-body" style={{ margin: 0, color: 'var(--v2-accent)', fontWeight: 600 }}>
            {project.impact}
          </p>
        )}
      </div>
      <div className="v2-row" style={{ gap: '8px', marginTop: '10px' }}>
        {project.tags.map((tag) => (
          <span key={tag} className="v2-chip">
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
          className="v2-row"
          style={{ justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '28px' }}
        >
          <span className="v2-mono v2-muted">{countLabel}</span>
          <div className="v2-row" role="group" aria-label="Filter projects by status" style={{ gap: '4px', flexWrap: 'wrap' }}>
            {FILTERS.map((f) => {
              const pressed = filter === f.value
              return (
                <button
                  key={f.value}
                  type="button"
                  className="v2-btn-quiet"
                  aria-pressed={pressed}
                  onClick={() => setFilter(f.value)}
                  style={{
                    color: pressed ? 'var(--v2-text)' : undefined,
                    borderColor: pressed ? 'var(--v2-accent)' : undefined,
                  }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>
      </Reveal>

      <div className="v2-grid" data-cols="2">
        {projects.map((project, i) => (
          <ProjectCard
            key={project.slug}
            project={project}
            dimmed={filter !== 'all' && project.status !== filter}
            delay={Math.min(i, 6) * 60}
          />
        ))}
      </div>
    </>
  )
}

export default ProjectsGrid
