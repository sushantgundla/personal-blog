'use client'

import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import Link from 'next/link'
import type { Project, ProjectStatus } from '@/lib/projects'
import { Reveal } from '../_components/Reveal'

type Filter = 'all' | ProjectStatus

const STATUS_LABEL: Record<ProjectStatus, string> = {
  confidential: 'Enterprise / Confidential',
  'open-source': 'Open Source',
  experiment: 'Experiments',
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open-source', label: 'Open Source' },
  { value: 'confidential', label: 'Confidential' },
  { value: 'experiment', label: 'Experiments' },
]

/**
 * The page is three blocks, one per status, in this order — not one big work
 * grid with the odd ones tacked on underneath.
 *
 * It used to be two: everything non-experiment in a single grid, then
 * Experiments. That put the one open-source project last in the work grid,
 * where it landed as a lone narrow column at the end of a row of Enterprise
 * cards with empty space beside it. It read as leftover, which is the opposite
 * of what it is.
 *
 * Open Source leads because it is the only work here anyone can actually go and
 * look at. The Enterprise projects are the bigger body of work but they are
 * described, not shown, so they read second. Experiments stay last: they are
 * the smallest claim on a reader's attention.
 *
 * Order in this array is the order on the page. `wide` means the block runs its
 * cards full width instead of in columns.
 */
const BLOCKS: { status: ProjectStatus; heading: string; caption: string; wide?: boolean }[] = [
  {
    status: 'open-source',
    heading: 'Open Source',
    caption: 'My own work, and public',
    wide: true,
  },
  {
    status: 'confidential',
    heading: 'Enterprise',
    caption: 'Built at work, so the details stay inside',
  },
  {
    status: 'experiment',
    heading: 'Experiments',
    caption: 'Built out of curiosity, not for work',
  },
]

// Paths served from this domain by a rewrite in next.config.js rather than by a
// route in this app. They must not be handed to next/link. See isProxied below.
const PROXIED_PATHS = ['/context-grid']

interface ProjectCardProps {
  project: Project
  dimmed: boolean
  delay: number
  /** Card runs the full width of its block, so cap its prose. See ProjectBlock. */
  wide?: boolean
}

function ProjectCard({ project, dimmed, delay, wide = false }: ProjectCardProps): JSX.Element {
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
      {/* A full-width card has no column to hold its line length down, so on a
          wide screen the description would run as one long line across the
          whole page. Cap the text at the site's reading measure; the tag row
          below is short chips and can keep the full width. */}
      <div className="prism-col" style={{ gap: '0.6rem', maxWidth: wide ? 'var(--prism-measure)' : undefined }}>
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

  // Most links here are internal paths, but a project can point at something
  // off-site (a GitHub repo, say). next/link is for routes this app owns — it
  // prefetches and routes on the client, which an outside URL cannot serve — so
  // an external link gets a plain anchor that opens in a new tab instead.
  // Detected by the "http" prefix, not by a domain, so any host works.
  const isExternal = !!project.link && /^https?:\/\//.test(project.link)

  // A third case: a path this app serves but does not own. /context-grid looks
  // internal and is not — next.config.js rewrites it to a separate Astro build
  // in its own Vercel project. next/link would try to route it on the client
  // and prefetch an RSC payload that does not exist, so it needs a plain anchor
  // like an external link, but in the same tab because the URL stays on this
  // domain.
  const isProxied = !!project.link && PROXIED_PATHS.some(
    (path) => project.link === path || project.link?.startsWith(`${path}/`)
  )
  const linkStyle = { display: 'block', height: '100%', textDecoration: 'none', color: 'inherit' }

  return (
    <Reveal delay={delay}>
      {project.link ? (
        isExternal ? (
          <a href={project.link} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            {card}
          </a>
        ) : isProxied ? (
          <a href={project.link} style={linkStyle}>
            {card}
          </a>
        ) : (
          <Link href={project.link} style={linkStyle}>
            {card}
          </Link>
        )
      ) : (
        card
      )}
    </Reveal>
  )
}

interface ProjectBlockProps {
  status: ProjectStatus
  heading: string
  caption: string
  projects: Project[]
  /** True when this block does not match the active filter. */
  dimmed: boolean
  /** Where this block's cards sit in the page-wide reveal stagger. */
  delayOffset: number
  wide: boolean
  first: boolean
}

function ProjectBlock({
  status,
  heading,
  caption,
  projects,
  dimmed,
  delayOffset,
  wide,
  first,
}: ProjectBlockProps): JSX.Element {
  // A real landmark, not a styled label: each block is a <section> named by its
  // own heading, so the three groups can be jumped between with a screen
  // reader. h2 because the page owns the h1 ("Projects") in page.tsx.
  const headingId = `projects-${status}`

  return (
    <section
      aria-labelledby={headingId}
      style={{ marginTop: first ? undefined : 'clamp(32px, 4vh, 48px)' }}
    >
      <Reveal>
        <div
          className="prism-row"
          style={{
            alignItems: 'baseline',
            gap: '12px',
            marginBottom: '18px',
            // The heading fades with its cards. Dimming the cards alone left a
            // bright title sitting over a block of faded content, which read as
            // a rendering fault rather than as "not what you filtered for".
            opacity: dimmed ? 0.35 : 1,
            transition: 'opacity var(--prism-dur) var(--prism-ease)',
          }}
        >
          <h2 id={headingId} className="prism-eyebrow">
            {heading}
          </h2>
          <span className="prism-mono prism-muted" style={{ fontSize: '0.85em' }}>
            {caption}
          </span>
        </div>
      </Reveal>
      <div className="prism-grid" data-cols={wide ? '1' : '2'}>
        {projects.map((project, i) => (
          <ProjectCard
            key={project.slug}
            project={project}
            dimmed={dimmed}
            delay={Math.min(delayOffset + i, 6) * 60}
            wide={wide}
          />
        ))}
      </div>
    </section>
  )
}

export function ProjectsGrid({ projects }: { projects: Project[] }): JSX.Element {
  const [filter, setFilter] = useState<Filter>('all')

  // One entry per BLOCKS row, in page order, carrying its own projects and its
  // slot in the reveal stagger. Empty blocks drop out here, so a status with no
  // projects never renders a heading over nothing.
  const blocks = useMemo(() => {
    let offset = 0
    return BLOCKS.map((block) => {
      const items = projects.filter((p) => p.status === block.status)
      const delayOffset = offset
      offset += items.length
      return {
        ...block,
        items,
        delayOffset,
        // Full width is for a block holding a single project — that is the case
        // the narrow-column-with-a-gap problem was about. If a second project
        // ever joins it, the ordinary two-column grid is the better shape and
        // this falls back to it on its own.
        wide: block.wide === true && items.length === 1,
      }
    }).filter((block) => block.items.length > 0)
  }, [projects])

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

      {/* Filtering dims rather than removes, so the page never reflows under
          the reader and the blocks they did not pick stay legible in place.
          Because a block now holds exactly one status, the whole block dims
          together — heading included. */}
      {blocks.map((block, i) => (
        <ProjectBlock
          key={block.status}
          status={block.status}
          heading={block.heading}
          caption={block.caption}
          projects={block.items}
          dimmed={filter !== 'all' && block.status !== filter}
          delayOffset={block.delayOffset}
          wide={block.wide}
          first={i === 0}
        />
      ))}
    </>
  )
}

export default ProjectsGrid
