import { siteConfig } from '@/lib/config'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: `About ${siteConfig.name}`,
}

const skillGroups = [
  {
    title: 'AI & Machine Learning',
    skills: siteConfig.skills.filter(s =>
      ['Agentic AI', 'RAG', 'LLMs', 'NLP', 'Computer Vision', 'PyTorch', 'Transformers'].includes(s.label)
    ),
  },
  {
    title: 'Frameworks & Tools',
    skills: siteConfig.skills.filter(s =>
      ['OpenAI', 'LangChain', 'FastAPI', 'MLOps'].includes(s.label)
    ),
  },
  {
    title: 'Infrastructure',
    skills: siteConfig.skills.filter(s =>
      ['AWS', 'Kubernetes', 'Docker'].includes(s.label)
    ),
  },
]

export default function AboutPage() {
  const bioParagraphs = siteConfig.bio.split('\n\n')

  return (
    <div>

      {/* ── Hero Section ── */}
      <section className="mb-32 animate-fade-up">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* Left column */}
          <div className="lg:col-span-7">
            <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-on-surface mb-8">
              Architecting the{' '}
              <span className="text-primary">Latent Space</span>.
            </h1>

            <div className="space-y-4 mb-10">
              {bioParagraphs.map((p, i) => (
                <p key={i} className="text-on-surface/80 text-lg leading-relaxed">
                  {p}
                </p>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="/resume.pdf"
                download
                className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-lg font-headline text-sm font-semibold tracking-tight hover:opacity-90 transition-opacity"
              >
                <span>↓</span>
                Download Resume
              </a>
              <a
                href="#journey"
                className="inline-flex items-center gap-2 border border-outline-variant px-6 py-3 rounded-lg font-headline text-sm font-semibold tracking-tight text-on-surface hover:border-primary/50 transition-colors"
              >
                View Projects
              </a>
            </div>
          </div>

          {/* Right column — Portrait */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden border border-outline-variant/20">
                <Image
                  src="/portrait.jpg"
                  alt={siteConfig.name}
                  width={480}
                  height={640}
                  className="w-full object-cover object-top"
                  style={{ aspectRatio: '17/24' }}
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Technical Stack ── */}
      <section className="mb-40 animate-fade-up delay-1">
        <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-10">
          Technical Stack
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {skillGroups.map((group) => (
            <div
              key={group.title}
              className="group/skill bg-surface-container-low p-8 rounded-lg border border-outline-variant/10 hover:border-primary/30 transition-all duration-300"
            >
              <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant group-hover/skill:text-primary transition-colors duration-300 mb-6">
                {group.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <span
                    key={skill.label}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 group-hover/skill:bg-primary/10 group-hover/skill:text-primary group-hover/skill:border-primary/20 transition-all duration-300"
                  >
                    {skill.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Professional Journey ── */}
      <section id="journey" className="mb-32 animate-fade-up delay-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-16">
          Professional Journey
        </h2>

        <div className="timeline-container relative border-l border-outline-variant/20">
          {siteConfig.work.map((job, i) => (
            <div key={i} className="timeline-entry relative pl-12 pb-16 last:pb-0">
              {/* Timeline dot */}
              <div
                className={`timeline-dot absolute left-0 top-1 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  i === 0 ? 'is-first' : ''
                }`}
              />

              <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant/60 block mb-2">
                {job.period}
              </span>
              <h3 className="text-2xl font-headline font-bold text-on-surface tracking-tight mb-1">
                {job.role}
              </h3>
              <p className="text-primary font-medium text-sm mb-3">
                {job.company}
                {job.location && (
                  <span className="text-on-surface-variant/60"> · {job.location}</span>
                )}
              </p>
              <p className="text-on-surface/70 leading-relaxed">
                {job.highlights[0]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Education ── */}
      <section className="mb-20 animate-fade-up delay-3">
        <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-16">
          Education
        </h2>

        <div className="relative border-l border-outline-variant/20">
          {siteConfig.education.map((edu, i) => (
            <div key={i} className="edu-entry relative pl-12 pb-16 last:pb-0">
              <div className="edu-dot absolute left-0 top-1 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all duration-300" />

              <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant/60 block mb-2">
                {edu.period}
              </span>
              <h3 className="text-2xl font-headline font-bold text-on-surface tracking-tight mb-1">
                {edu.degree}
              </h3>
              <p className="text-primary font-medium text-sm">
                {edu.school}
                {edu.grade && (
                  <span className="text-on-surface-variant/60"> · {edu.grade}</span>
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
