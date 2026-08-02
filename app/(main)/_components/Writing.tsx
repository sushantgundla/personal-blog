'use client'

import type { JSX } from 'react'
import Link from 'next/link'
import { projects, type Project, type ProjectStatus } from '@/lib/projects'
import { Reveal } from './Reveal'

export interface ArticleCard {
  slug: string
  title: string
  date: string
  description: string
  tags: string[]
  readingTime: string
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  production: 'Production',
  confidential: 'Enterprise / Confidential',
  'open-source': 'Open Source',
}

/** Turns "2026-03-12" into "12 Mar 2026". Falls back to the raw string if it doesn't parse. */
function formatDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface ProjectCardProps {
  project: Project
  lead?: boolean
}

function ProjectCard({ project, lead }: ProjectCardProps): JSX.Element {
  const inner = (
    <div
      className="v2-card v2-card-lift v2-col"
      style={{ height: '100%', justifyContent: 'space-between', paddingBlock: 'clamp(16px, 2.4vw, 24px)' }}
    >
      <div className="v2-col" style={{ gap: '0.6rem' }}>
        {/* Badge above the title, not beside it — "Enterprise / Confidential"
            is too long to share a row and was overflowing the card while
            squashing the title into the left half. Same fix as ProjectsGrid. */}
        <div className="v2-col" style={{ alignItems: 'flex-start', gap: '0.5rem' }}>
          <span className="v2-badge">{STATUS_LABEL[project.status]}</span>
          <span className={lead ? 'v2-sub' : 'v2-body'} style={{ fontWeight: 700 }}>
            {project.title}
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

  if (project.link) {
    return (
      <Link href={project.link} style={{ display: 'block', height: '100%', textDecoration: 'none', color: 'inherit' }}>
        {inner}
      </Link>
    )
  }

  return inner
}

interface ArticleCardTileProps {
  article: ArticleCard
}

function ArticleCardTile({ article }: ArticleCardTileProps): JSX.Element {
  return (
    <Link
      href={`/articles/${article.slug}`}
      style={{ display: 'block', height: '100%', textDecoration: 'none', color: 'inherit' }}
    >
      <div
        className="v2-card v2-card-lift v2-col"
        style={{ height: '100%', gap: '0.6rem', paddingBlock: 'clamp(16px, 2.4vw, 24px)' }}
      >
        <span className="v2-sub" style={{ fontWeight: 700 }}>
          {article.title}
        </span>
        <div className="v2-row" style={{ gap: '12px' }}>
          <span className="v2-mono v2-muted" style={{ fontSize: '0.85em' }}>
            {formatDate(article.date)}
          </span>
          <span className="v2-mono v2-muted" style={{ fontSize: '0.85em' }}>
            {article.readingTime}
          </span>
        </div>
        <p className="v2-body v2-muted" style={{ margin: 0 }}>
          {article.description}
        </p>
        <div className="v2-row" style={{ gap: '8px' }}>
          {article.tags.map((tag) => (
            <span key={tag} className="v2-chip">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

export function Writing({ articles }: { articles: ArticleCard[] }): JSX.Element {
  const featuredProjects = projects.slice(0, 4)
  const featuredArticles = articles.slice(0, 4)

  return (
    <section id="v2-writing" className="v2-section">
      <div className="v2-wrap">
        <Reveal>
          <span className="v2-eyebrow">Selected work</span>
          <h2 className="v2-head">Things I&apos;ve shipped</h2>
        </Reveal>

        <div className="v2-writing-projects" style={{ marginTop: '24px' }}>
          <Reveal className="v2-writing-lead">
            <ProjectCard project={featuredProjects[0]} lead />
          </Reveal>
          {featuredProjects.slice(1).map((project, i) => (
            <Reveal key={project.slug} delay={(i + 1) * 80}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>

        <div style={{ marginTop: 'clamp(32px, 4vh, 48px)' }}>
          <Reveal>
            <span className="v2-eyebrow">Writing</span>
            <h2 className="v2-head">Notes from building this stuff</h2>
          </Reveal>

          {featuredArticles.length === 0 ? (
            <Reveal delay={80}>
              <p className="v2-body v2-muted" style={{ marginTop: '24px' }}>
                Nothing published yet — check back soon.
              </p>
            </Reveal>
          ) : (
            <div className="v2-writing-articles" style={{ marginTop: '24px' }}>
              {featuredArticles.map((article, i) => (
                <Reveal key={article.slug} delay={i * 80}>
                  <ArticleCardTile article={article} />
                </Reveal>
              ))}
            </div>
          )}

          <Reveal delay={120}>
            <div style={{ marginTop: '24px' }}>
              <Link href="/articles" className="v2-btn-ghost">
                All writing →
              </Link>
            </div>
          </Reveal>
        </div>
      </div>

      <style>{`
        /* Featured project spans the full row as a wide banner, the other
           three sit in a row beneath it.
           The previous shape was a 1.3fr/1fr split with the lead card beside a
           stacked column of three. That height-matched the lead to all three
           siblings — ~1030px tall with a big block of dead space under its
           text on a wide display. Letting it run wide instead of tall uses the
           full-bleed width, keeps it clearly the lead, and leaves no hole. */
        .v2-writing-projects {
          display: grid;
          grid-template-columns: 1fr;
          gap: clamp(14px, 2vw, 20px);
          align-items: stretch;
        }
        @media (min-width: 720px) {
          .v2-writing-projects {
            grid-template-columns: repeat(3, 1fr);
          }
          .v2-writing-lead {
            grid-column: 1 / -1;
          }
        }
        .v2-writing-articles {
          display: grid;
          grid-template-columns: 1fr;
          gap: clamp(16px, 2.5vw, 28px);
        }
        @media (min-width: 640px) {
          .v2-writing-articles {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </section>
  )
}

export default Writing
