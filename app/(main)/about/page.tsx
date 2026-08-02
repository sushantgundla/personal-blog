import type { JSX } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { siteConfig } from '@/lib/config'
import { Reveal } from '../_components/Reveal'

export const metadata: Metadata = {
  title: 'About',
  description: `About ${siteConfig.name} — ${siteConfig.tagline}`,
}

/**
 * Skill taxonomy. Mirrors the grouping used in `_components/Signal.tsx` so a
 * skill lands in the same bucket everywhere on the site. Redefined locally
 * (not imported) since Signal's sets are a client-side filter concern, not
 * shared data — but the four buckets exactly partition all 29 skills.
 */
const AI_SYSTEMS = new Set([
  'Agentic AI', 'RAG', 'MCP', 'LLMs', 'NLP', 'Computer Vision', 'Agno',
  'LangGraph', 'LangChain', 'Fine-tuning', 'Prompt Engineering', 'Hugging Face',
  'Evals', 'Vector Databases', 'Embeddings', 'Semantic Search', 'Transformers',
])
const INFRA = new Set(['LiteLLM', 'AWS', 'Kubernetes', 'Docker', 'MLOps'])
const DATA = new Set(['Postgres', 'Redis'])
const LANG = new Set(['Python', 'FastAPI', 'Django', 'Claude Code', 'PyTorch'])

const SKILL_GROUPS: { title: string; skills: typeof siteConfig.skills }[] = [
  { title: 'AI Systems', skills: siteConfig.skills.filter((s) => AI_SYSTEMS.has(s.label)) },
  { title: 'Infra & MLOps', skills: siteConfig.skills.filter((s) => INFRA.has(s.label)) },
  { title: 'Data & Retrieval', skills: siteConfig.skills.filter((s) => DATA.has(s.label)) },
  { title: 'Languages & Frameworks', skills: siteConfig.skills.filter((s) => LANG.has(s.label)) },
]

/** Pulls the start year out of a period string like "Oct 2025 – Present". */
function startYear(period: string): string {
  const match = period.match(/\d{4}/)
  return match ? match[0] : period
}

/** Turns "Oct 2025 – Present" into a compact badge like "2025–" or "2019–2021". */
function badgeFor(period: string): string {
  const years = period.match(/\d{4}/g) ?? []
  if (years.length === 0) return period
  if (period.toLowerCase().includes('present')) return `${years[0]}–`
  if (years.length === 1) return years[0]
  return `${years[0]}–${years[years.length - 1]}`
}

export default function AboutPage(): JSX.Element {
  const { work, education, skills, bio } = siteConfig
  const bioParagraphs = bio.split('\n\n')

  // Pulled from the bio text itself ("7+ years across...") rather than
  // invented — the other two are plain counts of the data arrays.
  const yearsMatch = bio.match(/(\d+\+)\s+years/)
  const yearsExperience = yearsMatch ? yearsMatch[1] : `${work.length}`
  const companyCount = work.length
  const skillCount = skills.length

  const careerSpan = `${startYear(work[work.length - 1].period)} → present`

  return (
    <>
      {/* ── Header: identity + portrait ── */}
      <section id="v2-about-intro" className="v2-section">
        <div className="v2-wrap">
          <div
            className="v2-row"
            style={{ alignItems: 'center', gap: 'clamp(32px, 6vw, 80px)', flexWrap: 'wrap' }}
          >
            <div className="v2-col" style={{ flex: '1.3 1 480px', minWidth: '300px', gap: '1.5rem' }}>
              <Reveal>
                <span className="v2-eyebrow"><span className="v2-dot" />About</span>
                <h1 className="v2-title v2-title-xl" style={{ marginTop: '16px' }}>
                  Hi, I&apos;m {siteConfig.name}.
                </h1>
                <p className="v2-body v2-muted" style={{ marginTop: '14px' }}>{siteConfig.tagline}</p>
              </Reveal>

              <Reveal delay={80}>
                <div className="v2-row" style={{ gap: 'clamp(24px, 4vw, 48px)' }}>
                  <div className="v2-col" style={{ gap: '2px' }}>
                    <span className="v2-num">{yearsExperience}</span>
                    <span className="v2-mono v2-muted" style={{ fontSize: '0.82rem' }}>years experience</span>
                  </div>
                  <div className="v2-col" style={{ gap: '2px' }}>
                    <span className="v2-num">{companyCount}</span>
                    <span className="v2-mono v2-muted" style={{ fontSize: '0.82rem' }}>companies</span>
                  </div>
                  <div className="v2-col" style={{ gap: '2px' }}>
                    <span className="v2-num">{skillCount}</span>
                    <span className="v2-mono v2-muted" style={{ fontSize: '0.82rem' }}>skills &amp; tools</span>
                  </div>
                </div>
              </Reveal>
            </div>

            <div style={{ flex: '1 1 300px', minWidth: '240px', display: 'flex', justifyContent: 'center' }}>
              <Reveal delay={60}>
                <div
                  className="v2-frame"
                  style={{ position: 'relative', width: '100%', maxWidth: '340px', aspectRatio: '4 / 5' }}
                >
                  <Image
                    src="/portrait.jpg"
                    alt={`Portrait of ${siteConfig.name}`}
                    fill
                    priority
                    sizes="(max-width: 900px) 70vw, 340px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bio ── */}
      <section id="v2-about-bio" className="v2-section" style={{ paddingTop: 0 }}>
        <div className="v2-wrap">
          <div className="v2-col" style={{ gap: '1.1rem', maxWidth: 'var(--v2-measure)' }}>
            {bioParagraphs.map((paragraph, i) => (
              <Reveal key={i} delay={i * 60}>
                <p className="v2-body">{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Work history ── */}
      <section id="v2-about-work" className="v2-band v2-section">
        <div className="v2-wrap">
          <Reveal>
            <span className="v2-eyebrow"><span className="v2-dot" />Career</span>
            <h2 className="v2-head" style={{ marginTop: '12px' }}>Where I&apos;ve worked</h2>
            <div className="v2-row" style={{ gap: '18px', marginTop: '14px', flexWrap: 'wrap' }}>
              <span className="v2-mono v2-muted">{careerSpan}</span>
              <span className="v2-mono v2-muted">{companyCount} companies</span>
            </div>
          </Reveal>

          <div style={{ position: 'relative', marginTop: '32px' }}>
            <div
              style={{
                position: 'absolute',
                left: '5px',
                top: '8px',
                bottom: '8px',
                width: 0,
                borderLeft: '1px solid var(--v2-line)',
              }}
              aria-hidden="true"
            />
            <div className="v2-stack" style={{ gap: '20px' }}>
              {work.map((entry, i) => (
                <Reveal key={entry.company} delay={i * 70}>
                  <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: '16px', alignItems: 'start' }}>
                    <div style={{ position: 'relative', height: '100%' }}>
                      <span
                        className="v2-dot"
                        style={{ position: 'relative', top: '10px', width: '11px', height: '11px', display: 'block' }}
                      />
                    </div>

                    <div className="v2-card" style={{ paddingBlock: 'clamp(18px, 2.6vw, 26px)' }}>
                      <div className="v2-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                        <div className="v2-stack" style={{ gap: '4px' }}>
                          <div className="v2-row" style={{ alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span className="v2-sub">{entry.role}</span>
                            {i === 0 && <span className="v2-chip v2-chip-on">Current</span>}
                          </div>
                          <span className="v2-mono v2-muted" style={{ fontSize: '0.9em' }}>
                            {entry.company}
                            {entry.location && <> · {entry.location}</>}
                          </span>
                        </div>
                        <span className="v2-badge">{badgeFor(entry.period)}</span>
                      </div>

                      <div className="v2-stack" style={{ gap: '8px', marginTop: '16px' }}>
                        {entry.highlights.map((highlight) => (
                          <div key={highlight} className="v2-row" style={{ gap: '10px', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                            <span className="v2-dot" style={{ marginTop: '7px', flexShrink: 0 }} />
                            <span className="v2-body" style={{ fontSize: '0.95em', minWidth: 0, flex: 1 }}>
                              {highlight}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Education (quieter than work) ── */}
      <section id="v2-about-education" className="v2-section">
        <div className="v2-wrap">
          <Reveal>
            <span className="v2-eyebrow v2-muted">Education</span>
          </Reveal>
          <div className="v2-grid" data-cols="2" style={{ marginTop: '18px' }}>
            {education.map((edu, i) => (
              <Reveal key={edu.school} delay={i * 60}>
                <div className="v2-card" style={{ padding: '18px' }}>
                  <span className="v2-mono v2-muted" style={{ fontSize: '0.85em' }}>{edu.period}</span>
                  <div className="v2-body" style={{ marginTop: '8px', fontWeight: 600 }}>{edu.degree}</div>
                  <div className="v2-muted" style={{ fontSize: '0.92em', marginTop: '2px' }}>
                    {edu.school}
                    {edu.grade && <> · {edu.grade}</>}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Skills ── */}
      <section id="v2-about-skills" className="v2-section">
        <div className="v2-wrap v2-col" style={{ gap: 'clamp(20px, 3vw, 32px)' }}>
          <Reveal>
            <span className="v2-eyebrow"><span className="v2-dot" />Skills</span>
            <h2 className="v2-head" style={{ marginTop: '12px' }}>What I work with</h2>
          </Reveal>

          {SKILL_GROUPS.map((group, gi) => (
            <Reveal key={group.title} delay={gi * 60}>
              <div className="v2-col" style={{ gap: '0.75rem' }}>
                <span className="v2-mono v2-muted" style={{ fontSize: '0.85rem' }}>{group.title}</span>
                <div className="v2-row">
                  {group.skills.map((skill) => (
                    <span key={skill.label} className="v2-chip">{skill.label}</span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="v2-about-contact" className="v2-band v2-section">
        <div className="v2-wrap">
          <Reveal>
            <span className="v2-eyebrow"><span className="v2-dot" />Get in touch</span>
            <h2 className="v2-head" style={{ marginTop: '12px' }}>Let&apos;s talk.</h2>
          </Reveal>

          <Reveal delay={60}>
            <a
              href={`mailto:${siteConfig.email}`}
              className="v2-link"
              style={{ display: 'inline-block', marginTop: '24px', fontFamily: 'var(--v2-font-head)', fontSize: 'clamp(1.15rem, 2.6vw, 1.75rem)', fontWeight: 600 }}
            >
              {siteConfig.email}
            </a>
          </Reveal>

          <Reveal delay={120}>
            <div className="v2-row" style={{ marginTop: '28px', gap: '12px' }}>
              <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="v2-btn">
                Download CV
              </a>
              <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" className="v2-btn-ghost">
                GitHub
              </a>
              <a href={siteConfig.social.linkedin} target="_blank" rel="noopener noreferrer" className="v2-btn-ghost">
                LinkedIn
              </a>
              <a href={siteConfig.social.twitter} target="_blank" rel="noopener noreferrer" className="v2-btn-ghost">
                X
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
