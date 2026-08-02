'use client'

import { useState } from 'react'
import type { JSX } from 'react'
import { siteConfig } from '@/lib/config'
import { Reveal } from './Reveal'

/**
 * "What I do" section. Renders the AI platform as a layered system diagram
 * built entirely from .v2-card, plus a filterable skill cloud.
 */

type Group = 'all' | 'ai' | 'infra' | 'data' | 'lang'

interface LayerItem {
  id: string
  label: string
  desc: string
  tag: string
}

// Four layers, top to bottom on screen: what you build with agents, the
// agentic framework that runs them, the gateways and knowledge that serve it,
// and the foundation everything ultimately rests on. A row with more than one
// item renders side by side.
//
// Descriptions and mono tags are written as generic capability statements —
// what this kind of system does and what can be built with it — not as
// documentation of one employer's specific implementation.
const LAYERS: LayerItem[][] = [
  [
    {
      id: 'chatbot',
      label: 'Chatbot',
      desc: 'A conversational interface end users talk to directly',
      tag: 'chat.interface',
    },
    {
      id: 'automation',
      label: 'Automation Workflows',
      desc: 'Multi-step tasks an agent completes on a trigger, unattended',
      tag: 'workflow.auto',
    },
  ],
  [
    {
      id: 'agentic',
      label: 'Agentic Framework',
      desc: 'Config-driven agents, teams, and multi-step reasoning',
      tag: 'agent.framework',
    },
  ],
  [
    {
      id: 'llm',
      label: 'LLM Gateway',
      desc: 'One governed path to every model provider',
      tag: 'llm.gateway',
    },
    {
      id: 'mcp',
      label: 'MCP Gateway',
      desc: 'Routes tools and context to every agent',
      tag: 'mcp.gateway',
    },
    {
      id: 'knowledge',
      label: 'Knowledge Base',
      desc: 'Documents crawled, chunked, embedded, and indexed for search',
      tag: 'knowledge.base',
    },
  ],
]

// The foundation is deliberately NOT another row of cards. Three cards under
// three cards implies a one-to-one mapping that does not exist — infrastructure
// does not sit under the MCP gateway specifically, it carries the entire
// platform. So it renders as a single band spanning the full width, holding the
// external things everything above depends on: providers we call, infra we run
// on, and data arriving from outside.
const FOUNDATION: LayerItem[] = [
  {
    id: 'providers',
    label: 'Model Providers',
    desc: 'OpenAI, Anthropic and Bedrock behind one interface, swappable per task',
    tag: 'models',
  },
  {
    id: 'infra',
    label: 'Infrastructure',
    desc: 'EC2, ECS, Kubernetes and Docker — what the whole platform runs on',
    tag: 'infra',
  },
  {
    id: 'ingestion',
    label: 'Data & Ingestion',
    desc: 'Source data arriving from outside, made retrievable',
    tag: 'ingestion',
  },
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
const INFRA = new Set(['LiteLLM', 'AWS', 'Kubernetes', 'Docker', 'MLOps', 'Bedrock', 'OpenAI API', 'Anthropic API', 'Model Deployment'])
const DATA = new Set(['Postgres', 'Redis', 'Knowledge Bases', 'Document Ingestion', 'Information Retrieval'])
const LANG = new Set([
  'Python', 'FastAPI', 'Django', 'Claude Code', 'PyTorch', 'Cursor',
  'GitHub Copilot', 'Codex', 'Agent SDKs', 'Claude Agent SDK', 'Agentic Coding',
  'Backend Architecture', 'REST APIs', 'Async Python',
])

function groupOf(label: string): Group {
  if (AI_SYSTEMS.has(label)) return 'ai'
  if (INFRA.has(label)) return 'infra'
  if (DATA.has(label)) return 'data'
  if (LANG.has(label)) return 'lang'
  return 'ai'
}

type ConnectorVariant = 'single' | 'spread' | 'spread3' | 'merge' | 'support'

/**
 * Given the item counts of the row above and the row being connected into,
 * picks the connector shape: `single` (1-to-1), `spread` (1 forks to 2),
 * `spread3` (1 forks to 3), or `merge` (2+ cards come back to 1).
 */
function connectorVariant(prevCount: number, count: number): ConnectorVariant {
  if (prevCount > 1) return 'merge'
  if (count === 3) return 'spread3'
  if (count > 1) return 'spread'
  return 'single'
}

/**
 * Draws the line between two layer rows. `spread` fans one line into two
 * when the row below has two cards; `spread3` fans it into three; `merge`
 * brings cards from a paired row back into one. Stretches to the full row
 * width via preserveAspectRatio="none" so it lines up with the grid
 * above/below regardless of viewport width.
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
        : variant === 'spread3'
          ? 'M100,0 L100,18 L30,60 M100,18 L100,60 M100,18 L170,60'
          : variant === 'support'
            // A wide bracket: everything above rests on the band below, so the
            // line spans the full width rather than picking out columns.
            ? 'M8,60 L8,34 L192,34 L192,60 M40,34 L40,0 M100,34 L100,0 M160,34 L160,0'
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
      {/* --v2-muted, not --v2-faint. These tags ("chat.interface", "llm.gateway")
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
            {/* Rewritten for two reasons. It described the internal wiring of a
                specific employer's platform, which does not belong on a
                personal capability page; and it listed an ingestion pipeline
                and an infra layer that are no longer in the diagram below. It
                now describes the capability generically and matches the four
                layers actually shown. */}
            <p className="v2-body v2-muted">
              I build AI systems as one connected platform rather than five disconnected projects:
              gateways that make models and tools reliably available, a knowledge base that grounds
              them in real content, an agent framework standing on both, and the chatbots and
              automation workflows people actually use on top.
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
                {i > 0 && <Connector variant={connectorVariant(LAYERS[i - 1].length, row.length)} />}
                <Reveal delay={i * 90}>
                  {row.length > 1 ? (
                    <div className="v2-grid" data-cols={String(row.length)}>
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

            {/* Foundation band. Spans the full width because everything above
                rests on it — this is not a fourth column-aligned row. */}
            <Connector variant="support" />
            <Reveal delay={LAYERS.length * 90}>
              <div className="v2-panel v2-col" style={{ gap: '0.9rem' }}>
                <span className="v2-eyebrow">Runs on</span>
                <div className="v2-grid" data-cols="3">
                  {FOUNDATION.map((item) => (
                    <div
                      key={item.id}
                      className="v2-col"
                      style={{
                        gap: '0.3rem',
                        opacity: hoveredId !== null && hoveredId !== item.id ? 0.55 : 1,
                        transition: 'opacity var(--v2-dur-fast) var(--v2-ease)',
                      }}
                      onMouseEnter={() => setHoveredId(item.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <span className="v2-sub">{item.label}</span>
                      <p className="v2-body v2-muted" style={{ margin: 0 }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Part C — capability chips */}
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
        </div>
      </div>
    </section>
  )
}
