import Link from 'next/link'
import { getAllArticles } from '@/lib/articles'
import { projects } from '@/lib/projects'
import { getAllRadarPosts, getAllRadarPicks } from '@/lib/radar'
import { siteConfig } from '@/lib/config'
import { HeroBand } from './_components/HeroBand'
import { Marquee } from './_components/Marquee'
import { Reveal } from './_components/Reveal'

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function V4Home() {
  const articles = getAllArticles().slice(0, 3)
  const work = projects.slice(0, 3)
  const latestPulse = getAllRadarPosts()[0]
  const picks = getAllRadarPicks().slice(0, 4)
  const pulseClean = latestPulse
    ? latestPulse.content.replace(/^#+\s*/gm, '').replace(/[*_`>]/g, '').replace(/\s*—\s*/g, ', ').replace(/\s+/g, ' ').trim()
    : ''
  const pulseText = latestPulse
    ? pulseClean.length > 210
      ? pulseClean.slice(0, 210).trimEnd() + '…'
      : pulseClean
    : 'The agentic paradigm is not about replacing humans. It is about giving every engineer a fleet of tireless, context-aware collaborators.'

  return (
    <div>
      <HeroBand
        role="Technical Lead, AI/ML · PDI Technologies"
        intro="I build the AI platforms that ship at enterprise scale. Agent frameworks, RAG systems, and the infrastructure that makes production AI reliable."
      />

      <div className="v4-marquee-strip border-y border-outline-variant/60 py-6 md:py-7 bg-surface-container-low">
        <Marquee items={siteConfig.skills.map((s) => s.label)} />
      </div>

      <Section index="01" title="AI Radar" href="/v4/radar" linkLabel="All radar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          <Reveal>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-5">
                Latest Pulse
              </p>
              <blockquote className="v4-display italic text-2xl md:text-[1.9rem] leading-snug text-on-surface">
                {pulseText}
              </blockquote>
              {latestPulse && (
                <p className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant/70 mt-6">
                  {latestPulse.date}
                </p>
              )}
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-5">
                Recent Picks
              </p>
              <div className="flex flex-col divide-y divide-outline-variant/50">
                {picks.map((pick) => (
                  <a
                    key={pick.slug}
                    href={pick.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-on-surface text-sm font-medium group-hover:text-primary transition-colors">
                        {pick.title}
                      </p>
                      <p className="text-on-surface-variant text-xs mt-1 leading-relaxed line-clamp-2">
                        {pick.description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section index="02" title="Selected Writing" href="/v4/articles" linkLabel="All writing">
        <div>
          {articles.map((a, i) => (
            <Reveal key={a.slug} delay={i * 80}>
              <Link
                href={`/v4/articles/${a.slug}`}
                className="v4-row group relative block -mx-4 md:-mx-6 px-4 md:px-6 py-8 border-t border-outline-variant/60"
              >
                <span className="v4-row-fill" aria-hidden="true" />
                <div className="v4-row-content flex flex-col md:flex-row md:items-baseline md:justify-between gap-3 md:gap-10">
                  <div className="md:max-w-2xl">
                    <h3 className="v4-display font-bold tracking-tight text-2xl md:text-3xl leading-[1.12] text-on-surface group-hover:text-on-primary transition-colors">
                      {a.title}
                    </h3>
                    <p className="text-on-surface-variant group-hover:text-on-primary/80 mt-3 leading-relaxed transition-colors">
                      {a.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant group-hover:text-on-primary/80 shrink-0 transition-colors">
                    <time dateTime={a.date}>{formatDate(a.date)}</time>
                    <span className="opacity-40">·</span>
                    <span>{a.readingTime}</span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
          <div className="border-t border-outline-variant/60" />
        </div>
      </Section>

      <Section index="03" title="Selected Projects" href="/v4/projects" linkLabel="All projects">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7">
          {work.map((p, i) => (
            <Reveal key={p.slug} delay={i * 100}>
              <Link
                href="/v4/projects"
                className="v4-row group relative block h-full overflow-hidden border-t border-outline-variant/60 pt-6 px-4 pb-6"
              >
                <span className="v4-row-fill" aria-hidden="true" />
                <div className="v4-row-content">
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-on-surface-variant group-hover:text-on-primary/80 mb-3 transition-colors">
                    {p.organization} · {p.period}
                  </p>
                  <h3 className="v4-display font-bold tracking-tight text-xl leading-[1.15] text-on-surface group-hover:text-on-primary transition-colors mb-3">
                    {p.title}
                  </h3>
                  <p className="text-on-surface-variant text-[15px] leading-relaxed group-hover:text-on-primary/80 mb-4 transition-colors">
                    {p.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {p.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-on-surface-variant border border-outline-variant rounded-full px-2.5 py-1 group-hover:text-on-primary group-hover:border-on-primary/40 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <section className="mx-auto max-w-6xl px-5 md:px-8 py-16 md:py-24 border-t border-outline-variant/60">
        <Reveal>
          <p className="v4-display font-black tracking-tight text-on-surface text-3xl md:text-5xl max-w-3xl leading-[1.05]">
            Currently architecting the AI platform behind{' '}
            <span className="text-primary">MyPDI</span>.
          </p>
        </Reveal>
        <Reveal delay={100}>
          <p className="text-on-surface-variant text-lg mt-6 max-w-2xl">
            Open to conversations about hard AI problems at enterprise scale.
          </p>
        </Reveal>
        <Reveal delay={160}>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mt-10 font-mono text-sm uppercase tracking-widest">
            <a href={`mailto:${siteConfig.email}`} className="text-on-surface hover:text-primary transition-colors">
              {siteConfig.email}
            </a>
            <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">GitHub</a>
            <a href={siteConfig.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">LinkedIn</a>
            <a href={siteConfig.social.twitter} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">X</a>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

function Section({
  index,
  title,
  href,
  linkLabel,
  children,
}: {
  index: string
  title: string
  href: string
  linkLabel: string
  children: React.ReactNode
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 md:px-8 py-12 md:py-16 border-t border-outline-variant/60">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16">
        <div className="lg:col-span-3">
          <div className="v4-sticky-label flex items-center justify-between lg:block gap-4 mb-8 lg:mb-0">
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
              {index} / {title}
            </span>
            <Link href={href} className="lg:hidden text-sm text-on-surface-variant hover:text-primary transition-colors">
              {linkLabel} →
            </Link>
            <Link href={href} className="hidden lg:block mt-4 text-sm text-on-surface-variant hover:text-primary transition-colors">
              {linkLabel} →
            </Link>
          </div>
        </div>
        <div className="lg:col-span-9">{children}</div>
      </div>
    </section>
  )
}
