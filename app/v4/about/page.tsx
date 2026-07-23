import Image from 'next/image'
import { siteConfig } from '@/lib/config'
import { Reveal } from '../_components/Reveal'

const skillGroups = [
  {
    title: 'AI & Machine Learning',
    skills: siteConfig.skills.filter((s) =>
      ['Agentic AI', 'RAG', 'MCP', 'LLMs', 'NLP', 'Computer Vision', 'PyTorch', 'Transformers', 'Fine-tuning', 'Prompt Engineering', 'Hugging Face', 'Evals'].includes(s.label)
    ),
  },
  {
    title: 'Frameworks & Tools',
    skills: siteConfig.skills.filter((s) =>
      ['Agno', 'LiteLLM', 'FastAPI', 'Claude Code', 'MLOps', 'LangGraph', 'LangChain', 'Python', 'Django'].includes(s.label)
    ),
  },
  {
    title: 'Data & Retrieval',
    skills: siteConfig.skills.filter((s) =>
      ['Vector Databases', 'Embeddings', 'Semantic Search', 'Postgres', 'Redis'].includes(s.label)
    ),
  },
  {
    title: 'Infrastructure',
    skills: siteConfig.skills.filter((s) => ['AWS', 'Kubernetes', 'Docker'].includes(s.label)),
  },
]

export default function V4About() {
  const bio = siteConfig.bio.split('\n\n')

  return (
    <div>
      <section className="mx-auto max-w-6xl px-5 md:px-8 pt-16 md:pt-24 pb-12 md:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <Reveal>
              <p className="font-mono text-[11px] md:text-xs uppercase tracking-[0.28em] text-on-surface-variant">
                Technical Lead, AI/ML · PDI Technologies
              </p>
              <h1 className="v4-display font-black tracking-tight text-on-surface text-5xl sm:text-6xl md:text-7xl leading-[0.95] mt-5">
                Architecting the{' '}
                <span className="text-primary">Latent Space</span>.
              </h1>
            </Reveal>

            <div className="mt-10 max-w-2xl space-y-6">
              {bio.map((p, i) => (
                <Reveal key={i} delay={100 + i * 80}>
                  <p className="text-on-surface-variant text-lg leading-relaxed">{p}</p>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2">
            <Reveal delay={100}>
              <div className="group relative mx-auto w-56 sm:w-72 lg:w-full lg:max-w-none max-w-sm">
                <div className="relative aspect-[4/5] overflow-hidden border border-outline-variant bg-surface-container-highest">
                  <Image
                    src="/portrait.jpg"
                    alt="Sushant Gundla"
                    fill
                    sizes="(max-width: 1024px) 288px, 30vw"
                    className="object-cover object-top grayscale-[0.5] transition-all duration-700 ease-out group-hover:grayscale-0"
                    unoptimized
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Section index="01" title="Experience">
        <div className="space-y-0">
          {siteConfig.work.map((job, i) => (
            <Reveal key={job.company} delay={i * 80}>
              <div className="relative pl-8 md:pl-10 pb-12 last:pb-0 border-l border-outline-variant/60 last:border-transparent">
                <span className="absolute -left-[7px] top-1 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-surface" />
                <p className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
                  {job.period}
                </p>
                <h3 className="v4-display font-bold tracking-tight text-2xl md:text-4xl leading-[1.08] text-on-surface mt-3">
                  {job.role}
                </h3>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-3 text-sm">
                  <span className="text-primary font-semibold">{job.company}</span>
                  <span className="text-on-surface-variant">· {job.location}</span>
                </div>
                <ul className="mt-6 space-y-3 max-w-2xl">
                  {job.highlights.map((h, hi) => (
                    <li key={hi} className="flex gap-3 text-on-surface-variant leading-relaxed">
                      <span className="text-primary shrink-0 mt-[9px] w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section index="02" title="Education">
        <div className="space-y-10">
          {siteConfig.education.map((edu, i) => (
            <Reveal key={edu.school} delay={i * 80}>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
                  {edu.period}
                </p>
                <h3 className="v4-display font-bold tracking-tight text-xl md:text-2xl leading-[1.15] text-on-surface mt-3">
                  {edu.degree}
                </h3>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-2 text-sm">
                  <span className="text-primary font-semibold">{edu.school}</span>
                  {edu.grade && <span className="text-on-surface-variant">· {edu.grade}</span>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section index="03" title="Technical Stack">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {skillGroups.map((group, i) => (
            <Reveal key={group.title} delay={i * 80}>
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant mb-5">
                  {group.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <span
                      key={skill.label}
                      className="border border-outline-variant rounded-full px-3 py-1.5 text-sm text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors"
                    >
                      {skill.label}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
    </div>
  )
}

function Section({
  index,
  title,
  children,
}: {
  index: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 md:px-8 py-12 md:py-16 border-t border-outline-variant/60">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16">
        <div className="lg:col-span-3">
          <div className="v4-sticky-label">
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
              {index} / {title}
            </span>
          </div>
        </div>
        <div className="lg:col-span-9">{children}</div>
      </div>
    </section>
  )
}
