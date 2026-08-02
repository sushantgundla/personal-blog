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
 * Skill taxonomy for the "Technical Stack" section. Mirrors the grouping used
 * on the v4 prototype (app/v4/about/page.tsx) so the same four buckets show
 * up here. Anything in siteConfig.skills that doesn't match one of the four
 * label lists still renders — it lands in a trailing "Also" group instead of
 * being silently dropped.
 */
const SKILL_GROUPS: { title: string; labels: string[] }[] = [
  {
    title: 'AI & Machine Learning',
    labels: [
      'Agentic AI', 'RAG', 'MCP', 'LLMs', 'NLP', 'Computer Vision', 'PyTorch',
      'Transformers', 'Fine-tuning', 'Prompt Engineering', 'Hugging Face', 'Evals',
      'Sentence Transformers', 'OCR', 'Multi-Agent Systems', 'Conversational AI',
      'Agent Orchestration', 'RoBERTa',
    ],
  },
  {
    title: 'Frameworks & Tools',
    labels: [
      'Agno', 'LiteLLM', 'FastAPI', 'Claude Code', 'MLOps', 'LangGraph', 'LangChain',
      'Python', 'Django', 'Next.js', 'TypeScript', 'LLM Gateway',
    ],
  },
  {
    title: 'Data & Retrieval',
    labels: [
      'Vector Databases', 'Embeddings', 'Semantic Search', 'Postgres', 'Redis',
      'Data Visualization', 'Document Ingestion', 'Knowledge Bases', 'Information Retrieval',
    ],
  },
  {
    title: 'Infrastructure',
    labels: ['AWS', 'Kubernetes', 'Docker', 'Model Deployment'],
  },
]

function buildSkillGroups(): { title: string; skills: typeof siteConfig.skills }[] {
  const groups = SKILL_GROUPS.map((group) => ({
    title: group.title,
    skills: siteConfig.skills.filter((s) => group.labels.includes(s.label)),
  }))
  const placed = new Set(SKILL_GROUPS.flatMap((g) => g.labels))
  const rest = siteConfig.skills.filter((s) => !placed.has(s.label))
  if (rest.length > 0) groups.push({ title: 'Also', skills: rest })
  return groups
}

export default function AboutPage(): JSX.Element {
  const { work, education, bio } = siteConfig
  const bioParagraphs = bio.split('\n\n')
  const skillGroups = buildSkillGroups()

  return (
    <>
      {/* ── Header: eyebrow, headline, bio, actions + portrait ── */}
      <section id="v2-about-intro" className="v2-section">
        <div className="v2-wrap">
          <div
            className="v2-row"
            style={{ alignItems: 'flex-start', gap: 'clamp(32px, 6vw, 80px)', flexWrap: 'wrap' }}
          >
            <div className="v2-col" style={{ flex: '1 1 380px', minWidth: '300px', gap: '1.5rem' }}>
              <Reveal>
                <span className="v2-eyebrow">Technical Lead, AI/ML · PDI Technologies</span>
                <h1 className="v2-title v2-title-xl v2-about-title" style={{ marginTop: '16px' }}>
                  Architecting the <span style={{ color: 'var(--v2-accent)' }}>Latent Space</span>.
                </h1>
              </Reveal>

              <div className="v2-col" style={{ gap: '1.1rem', maxWidth: 'var(--v2-measure)' }}>
                {bioParagraphs.map((paragraph, i) => (
                  <Reveal key={i} delay={80 + i * 60}>
                    <p className="v2-body v2-muted v2-about-bio" lang="en">{paragraph}</p>
                  </Reveal>
                ))}
              </div>

              <Reveal delay={80 + bioParagraphs.length * 60}>
                <div className="v2-row" style={{ gap: '12px', flexWrap: 'wrap' }}>
                  <a
                    href="/resume.pdf"
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="v2-btn"
                  >
                    Download Resume
                  </a>
                  <a href="/projects" className="v2-btn-ghost">
                    View Projects
                  </a>
                </div>
              </Reveal>
            </div>

            <div style={{ flex: '0 1 auto', minWidth: '340px', display: 'flex', justifyContent: 'center' }}>
              <Reveal delay={60}>
                {/* Self-sizing width, not width:100%. Reveal renders a plain
                    div that becomes a flex item here, so it sizes to content —
                    a percentage width resolved against zero and collapsed the
                    frame to 2x3px, hiding the portrait entirely. This is the
                    most important element on the page — it must read as a
                    co-equal presence next to the headline, not an accessory,
                    so it runs up to 620px wide (was 500px). The row item above
                    uses flex: '0 1 auto' (not flex-grow) so the box tracks the
                    frame's own content width exactly — a growing flex item
                    with fixed-width content just wastes space as blank
                    padding around a centered image, it doesn't make the photo
                    bigger. The text column (flex: '1 1 380px') is the only
                    item that grows, so it gets everything this frame doesn't
                    use — see v2-about-title below for the arithmetic that
                    depends on this. */}
                <div
                  className="v2-frame"
                  style={{ position: 'relative', width: 'min(620px, 44vw)', aspectRatio: '4 / 5' }}
                >
                  <Image
                    src="/portrait.jpg"
                    alt={`Portrait of ${siteConfig.name}`}
                    fill
                    priority
                    sizes="(max-width: 900px) 70vw, 620px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── 01 / EXPERIENCE ── */}
      <section id="v2-about-work" className="v2-section" style={{ paddingTop: 0 }}>
        <div className="v2-wrap">
          <Reveal>
            <div className="v2-rule" />
          </Reveal>
          <Reveal>
            <span className="v2-eyebrow" style={{ display: 'inline-block', marginTop: '24px' }}>
              01 / EXPERIENCE
            </span>
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
            <div className="v2-stack v2-work-stack" style={{ gap: '20px' }}>
              {work.map((entry, i) => (
                <Reveal key={entry.company} delay={i * 70}>
                  <div className="v2-work-role" style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: '16px', alignItems: 'start' }}>
                    <div style={{ position: 'relative', height: '100%' }}>
                      <span
                        className="v2-dot"
                        style={{ position: 'relative', top: '10px', width: '11px', height: '11px', display: 'block' }}
                      />
                    </div>

                    <a
                      href={siteConfig.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${entry.role} at ${entry.company} on LinkedIn`}
                      className="v2-card v2-work-link"
                      style={{ display: 'block', paddingBlock: 'clamp(18px, 2.6vw, 26px)', textDecoration: 'none', color: 'inherit' }}
                    >
                      <div
                        className="v2-row"
                        style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}
                      >
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
                        <span className="v2-badge">{entry.period}</span>
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

                      <div className="v2-work-cta">
                        View on LinkedIn
                        <span className="v2-work-cta-arrow" aria-hidden="true">→</span>
                      </div>
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 02 / EDUCATION ── */}
      <section id="v2-about-education" className="v2-section" style={{ paddingTop: 0 }}>
        <div className="v2-wrap">
          <Reveal>
            <div className="v2-rule" />
          </Reveal>
          <Reveal>
            <span className="v2-eyebrow" style={{ display: 'inline-block', marginTop: '24px' }}>
              02 / EDUCATION
            </span>
          </Reveal>
          <div className="v2-grid" data-cols="2" style={{ marginTop: '18px' }}>
            {education.map((edu, i) => (
              <Reveal key={edu.school} delay={i * 60}>
                <div className="v2-card v2-about-edu" style={{ padding: '18px' }}>
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

      {/* ── 03 / TECHNICAL STACK ── */}
      <section id="v2-about-skills" className="v2-section" style={{ paddingTop: 0 }}>
        <div className="v2-wrap v2-col" style={{ gap: 'clamp(20px, 3vw, 32px)' }}>
          <Reveal>
            <div className="v2-rule" />
          </Reveal>
          <Reveal>
            <span className="v2-eyebrow" style={{ display: 'inline-block', marginTop: '24px' }}>
              03 / TECHNICAL STACK
            </span>
          </Reveal>

          {skillGroups.map((group, gi) => (
            <Reveal key={group.title} delay={gi * 60}>
              <div className="v2-col" style={{ gap: '0.75rem' }}>
                <span className="v2-mono v2-muted" style={{ fontSize: '0.85rem' }}>{group.title}</span>
                <div className="v2-row">
                  {group.skills.map((skill) => (
                    <span key={skill.label} className="v2-chip v2-about-chip">{skill.label}</span>
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
              style={{
                display: 'inline-block',
                marginTop: '24px',
                fontFamily: 'var(--v2-font-head)',
                fontSize: 'clamp(1.15rem, 2.6vw, 1.75rem)',
                fontWeight: 600,
              }}
            >
              {siteConfig.email}
            </a>
          </Reveal>

          <Reveal delay={120}>
            <div className="v2-row" style={{ marginTop: '28px', gap: '12px' }}>
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

      {/* Scoped hover/focus behaviour for this page only — all colour and
          timing come from the --v2-* tokens so every theme reskins it for
          free. No structural properties (width/height/margin) are touched,
          only transform/colour, so nothing shifts layout on hover. */}
      {/* dangerouslySetInnerHTML, not a text child. React escapes double quotes
          and apostrophes to &quot; / &#x27; inside a <style> text child on the
          server but not on the client, and the mismatch throws away the whole
          server render. Any comment or selector in here containing a quote
          triggers it — which it did. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* The portrait is the priority element on this page — it now runs
           up to 620px wide (was 500px, then 500px again — this is the third
           pass). .v2-title-xl's default clamp(3rem, 11vw, 9rem) was sized for
           a headline with no photo competing for width, so we trim its top
           end here. Headline text itself is untouched. */
        /* Recomputed for the 620px portrait. The text column above uses
           flex: 1 1 380px against a photo column at flex: 0 1 auto, so the
           text column width is simply: wrap width − row gap − rendered
           photo width. Row gap and side gutters are the site's own
           clamp(32px,6vw,80px) and clamp(16px,3.5vw,72px), photo width is
           min(620px, 44vw). Worst case (narrowest column) is the smallest
           reference viewport:
             1280px → column ≈ 550px   1440px → column ≈ 639px   1728px → column ≈ 907px
           "Architecting" — one unbreakable word — measured 694px wide at a
           108px font-size in this font/tracking (the prior clipping
           incident), i.e. ≈ 6.43px of word-width per 1px of font-size. At
           5.75vw the worst case (1280px) renders a 73.6px headline needing
           ≈ 473px, against a 550px column — an ~14% margin, growing at every
           wider breakpoint since the photo caps out at 620px while the
           column keeps widening. overflow-wrap stays as a hard guard so it
           can never clip again even if this arithmetic is off. */
        .v2-about-title {
          font-size: clamp(2.5rem, 5.75vw, 6rem);
          line-height: 0.94;
          overflow-wrap: break-word;
        }

        /* Justified bio prose only — short text (labels, chips, headings,
           experience highlights) stays left-aligned; justifying short lines
           produces uneven word spacing, not straight edges. hyphens: auto
           plus lang="en" on the <p> (set in the JSX) prevents the ragged
           gaps ("rivers") justification causes without hyphenation. */
        .v2-about-bio {
          text-align: justify;
          hyphens: auto;
        }

        .v2-work-role {
          transition: opacity var(--v2-dur) var(--v2-ease), transform var(--v2-dur) var(--v2-ease);
        }
        .v2-work-stack:hover .v2-work-role:not(:hover):not(:focus-within),
        .v2-work-stack:focus-within .v2-work-role:not(:focus-within) {
          opacity: 0.55;
          transform: scale(0.985);
        }
        .v2-work-link:hover,
        .v2-work-link:focus-visible {
          transform: translateY(-4px);
          border-color: var(--v2-accent);
          background: var(--v2-surface-2);
          box-shadow: var(--v2-glow), var(--v2-shadow-lg);
        }
        .v2-work-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.35em;
          margin-top: 14px;
          font-family: var(--v2-font-head);
          font-weight: 600;
          font-size: 0.82rem;
          letter-spacing: 0.01em;
          color: var(--v2-muted);
          opacity: 0.75;
          transition: color var(--v2-dur-fast) var(--v2-ease), opacity var(--v2-dur-fast) var(--v2-ease);
        }
        .v2-work-link:hover .v2-work-cta,
        .v2-work-link:focus-visible .v2-work-cta {
          color: var(--v2-accent);
          opacity: 1;
        }
        .v2-work-cta-arrow {
          display: inline-block;
          transition: transform var(--v2-dur-fast) var(--v2-ease);
        }
        .v2-work-link:hover .v2-work-cta-arrow,
        .v2-work-link:focus-visible .v2-work-cta-arrow {
          transform: translateX(4px);
        }

        .v2-about-edu {
          transition: transform var(--v2-dur-fast) var(--v2-ease), border-color var(--v2-dur-fast) var(--v2-ease),
            background var(--v2-dur-fast) var(--v2-ease), box-shadow var(--v2-dur-fast) var(--v2-ease);
        }
        .v2-about-edu:hover {
          transform: translateY(-3px);
          border-color: var(--v2-accent);
          background: var(--v2-surface-2);
          box-shadow: var(--v2-glow), var(--v2-shadow);
        }

        .v2-about-chip {
          transition: transform var(--v2-dur-fast) var(--v2-ease), border-color var(--v2-dur-fast) var(--v2-ease),
            background var(--v2-dur-fast) var(--v2-ease), color var(--v2-dur-fast) var(--v2-ease),
            box-shadow var(--v2-dur-fast) var(--v2-ease);
        }
        .v2-about-chip:hover {
          transform: translateY(-2px);
          border-color: var(--v2-accent);
          background: var(--v2-accent-soft);
          color: var(--v2-accent);
          box-shadow: var(--v2-glow);
        }

        @media (prefers-reduced-motion: reduce) {
          .v2-work-role,
          .v2-work-link,
          .v2-work-cta,
          .v2-work-cta-arrow,
          .v2-about-edu,
          .v2-about-chip {
            transition: none !important;
          }
          .v2-work-stack:hover .v2-work-role:not(:hover):not(:focus-within),
          .v2-work-stack:focus-within .v2-work-role:not(:focus-within),
          .v2-work-link:hover,
          .v2-work-link:focus-visible,
          .v2-about-edu:hover,
          .v2-about-chip:hover {
            transform: none;
          }
        }
      `,
        }}
      />
    </>
  )
}
