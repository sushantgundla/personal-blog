'use client'

import { useState } from 'react'
import type { JSX } from 'react'
import { siteConfig } from '@/lib/config'
import { Reveal } from './Reveal'

/**
 * "What I do" section. Renders the AI platform as a layered system diagram
 * built entirely from .v2-card, plus a filterable skill cloud and three
 * headline numbers pulled from real work history.
 */

type Group = 'all' | 'ai' | 'infra' | 'data' | 'lang'

interface LayerItem {
  id: string
  label: string
  desc: string
  tag: string
}

// Five layers, top to bottom. A row with more than one item renders side by side.
const LAYERS: LayerItem[][] = [
  [
    {
      id: 'chatbot',
      label: 'Chatbot',
      desc: 'The customer-facing surface for retail and petroleum operators',
      tag: 'chat.mypdi',
    },
  ],
  [
    {
      id: 'agentic',
      label: 'Agentic Framework',
      desc: 'Config-driven agents, teams, and multi-step workflows',
      tag: 'agents.run()',
    },
  ],
  [
    {
      id: 'mcp',
      label: 'MCP Gateway',
      desc: 'Routes tools and context to every agent',
      tag: 'mcp://gateway',
    },
    {
      id: 'llm',
      label: 'LLM Gateway',
      desc: 'One governed path to every model provider',
      tag: 'llm://gateway',
    },
  ],
  [
    {
      id: 'ingestion',
      label: 'Ingestion Pipeline',
      desc: 'Crawl, chunk, embed, index — continuously',
      tag: 'ingest.pipeline',
    },
  ],
  [
    {
      id: 'infra',
      label: 'Model Deployment & Infra',
      desc: 'Serving and the infrastructure that runs it all in production',
      tag: 'infra.deploy',
    },
  ],
]

const FILTERS: { id: Group; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ai', label: 'AI Systems' },
  { id: 'infra', label: 'Infra' },
  { id: 'data', label: 'Data' },
  { id: 'lang', label: 'Languages & Frameworks' },
]

const AI_SYSTEMS = new Set([
  'Agentic AI', 'RAG', 'MCP', 'LLMs', 'NLP', 'Computer Vision', 'Agno',
  'LangGraph', 'LangChain', 'Fine-tuning', 'Prompt Engineering', 'Hugging Face',
  'Evals', 'Vector Databases', 'Embeddings', 'Semantic Search', 'Transformers',
])
const INFRA = new Set(['LiteLLM', 'AWS', 'Kubernetes', 'Docker', 'MLOps'])
const DATA = new Set(['Postgres', 'Redis'])
const LANG = new Set(['Python', 'FastAPI', 'Django', 'Claude Code', 'PyTorch'])

function groupOf(label: string): Group {
  if (AI_SYSTEMS.has(label)) return 'ai'
  if (INFRA.has(label)) return 'infra'
  if (DATA.has(label)) return 'data'
  if (LANG.has(label)) return 'lang'
  return 'ai'
}

const STATS = [
  { num: '7+', eyebrow: 'Years', body: 'Across Generative AI, NLP, and Computer Vision' },
  { num: '60%', eyebrow: 'Faster resolution', body: 'Cut ticket resolution time with an agentic recommender at ConnectWise' },
  { num: '300M+', eyebrow: 'Documents queried', body: 'Curie, a RAG system that answers in under 10 seconds at that scale' },
]

type ConnectorVariant = 'single' | 'spread' | 'merge'

/**
 * Draws the line between two layer rows. `spread` fans one line into two
 * when the row below has two cards; `merge` brings two lines back into one.
 * Stretches to the full row width via preserveAspectRatio="none" so it lines
 * up with the grid above/below regardless of viewport width.
 */
function Connector({ variant }: { variant: ConnectorVariant }): JSX.Element {
  const common = {
    width: '100%',
    height: 'clamp(10px, 1.4vw, 18px)',
    viewBox: '0 0 200 60',
    preserveAspectRatio: 'none' as const,
    'aria-hidden': true,
    style: { display: 'block' },
  }

  const path =
    variant === 'single'
      ? 'M100,0 L100,60'
      : variant === 'spread'
        ? 'M100,0 L100,22 L40,60 M100,22 L160,60'
        : 'M40,0 L100,38 L100,60 M160,0 L100,38'

  return (
    <svg {...common}>
      <path d={path} fill="none" stroke="var(--v2-line-2)" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

function LayerCard({
  item,
  hoveredId,
  onHover,
}: {
  item: LayerItem
  hoveredId: string | null
  onHover: (id: string | null) => void
}): JSX.Element {
  const dimmed = hoveredId !== null && hoveredId !== item.id

  return (
    <div
      className="v2-card v2-card-lift v2-col"
      style={{
        gap: '0.4rem',
        paddingBlock: 'clamp(12px, 1.6vw, 16px)',
        opacity: dimmed ? 0.55 : 1,
        transition: 'opacity var(--v2-dur-fast) var(--v2-ease)',
      }}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
    >
      <span className="v2-sub">{item.label}</span>
      <p className="v2-body v2-muted" style={{ margin: 0 }}>{item.desc}</p>
      {/* --v2-muted, not --v2-faint. These tags ("chat.mypdi", "agents.run()")
          are real content, and --v2-faint is a 0.30-alpha watermark tone — it
          measured as low as 1.9:1 in several dimensions. */}
      <span className="v2-mono" style={{ fontSize: '0.78rem', color: 'var(--v2-muted)' }}>{item.tag}</span>
    </div>
  )
}

export function Signal(): JSX.Element {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [activeGroup, setActiveGroup] = useState<Group>('all')

  return (
    <section id="v2-signal" className="v2-section">
      <div className="v2-wrap v2-col" style={{ gap: 'clamp(20px, 3vw, 36px)' }}>
        {/* Part A — thesis */}
        <Reveal>
          <div className="v2-col" style={{ maxWidth: 720, gap: '1rem' }}>
            <span className="v2-eyebrow"><span className="v2-dot" />What I build</span>
            <h2 className="v2-head">One connected AI platform, not five separate projects</h2>
            <p className="v2-body v2-muted">
              I architect the AI platform behind MyPDI as a single connected system: an agentic
              framework, a document ingestion pipeline that feeds it, an MCP gateway and an LLM
              gateway that route every request, and a customer-facing chatbot on top — plus the
              model deployment and infrastructure that keep all of it running in production.
            </p>
          </div>
        </Reveal>

        {/* Part B — stack diagram */}
        <div className="v2-col" style={{ gap: '0.75rem' }}>
          <Reveal>
            <span className="v2-eyebrow"><span className="v2-dot" />The stack, top to bottom</span>
          </Reveal>
          <div className="v2-col" style={{ gap: 0 }}>
            {LAYERS.map((row, i) => (
              <div key={row[0]?.id ?? i}>
                {i > 0 && (
                  <Connector
                    variant={
                      LAYERS[i - 1].length === row.length ? 'single' : row.length > 1 ? 'spread' : 'merge'
                    }
                  />
                )}
                <Reveal delay={i * 90}>
                  {row.length > 1 ? (
                    <div className="v2-grid" data-cols="2">
                      {row.map((item) => (
                        <LayerCard key={item.id} item={item} hoveredId={hoveredId} onHover={setHoveredId} />
                      ))}
                    </div>
                  ) : (
                    <LayerCard item={row[0]} hoveredId={hoveredId} onHover={setHoveredId} />
                  )}
                </Reveal>
              </div>
            ))}
          </div>
        </div>

        {/* Part C — capability chips + headline numbers */}
        <div className="v2-col" style={{ gap: '1.25rem' }}>
          <Reveal>
            <div className="v2-col" style={{ gap: '0.75rem' }}>
              <span className="v2-eyebrow"><span className="v2-dot" />Capabilities</span>
              <div className="v2-row" role="group" aria-label="Filter skills by category">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`v2-btn-quiet${activeGroup === f.id ? ' v2-chip-on' : ''}`}
                    aria-pressed={activeGroup === f.id}
                    onClick={() => setActiveGroup(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="v2-row">
                {siteConfig.skills.map((skill) => {
                  const g = groupOf(skill.label)
                  const matches = activeGroup === 'all' || g === activeGroup
                  const emphasize = activeGroup !== 'all' && g === activeGroup
                  return (
                    <span
                      key={skill.label}
                      className={`v2-chip${emphasize ? ' v2-chip-on' : ''}`}
                      style={{
                        opacity: matches ? 1 : 0.4,
                        transition: 'opacity var(--v2-dur-fast) var(--v2-ease), border-color var(--v2-dur-fast) var(--v2-ease), color var(--v2-dur-fast) var(--v2-ease), background var(--v2-dur-fast) var(--v2-ease)',
                      }}
                    >
                      {skill.label}
                    </span>
                  )
                })}
              </div>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <div className="v2-grid" data-cols="3">
              {STATS.map((s) => (
                <div
                  key={s.eyebrow}
                  className="v2-card v2-col"
                  style={{ gap: '0.4rem', paddingBlock: 'clamp(14px, 2vw, 18px)' }}
                >
                  <span className="v2-num">{s.num}</span>
                  <span className="v2-eyebrow">{s.eyebrow}</span>
                  <p className="v2-body v2-muted" style={{ margin: 0 }}>{s.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
