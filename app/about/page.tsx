import { siteConfig } from '@/lib/config'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: `About ${siteConfig.name}`,
}

const skillColors: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-800',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  green:  'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border border-green-200 dark:border-green-800',
  pink:   'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300 border border-pink-200 dark:border-pink-800',
  teal:   'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
}

const companyAccents = [
  'border-l-[var(--accent)]',
  'border-l-[var(--accent-violet)]',
  'border-l-[var(--accent-blue)]',
]

export default function AboutPage() {
  return (
    <div className="space-y-16">

      {/* Hero — portrait + name + bio */}
      <section className="animate-fade-up">
        <div className="flex flex-col md:flex-row gap-10 items-start mb-8">
          {/* Portrait */}
          <div className="flex-shrink-0 w-full md:w-auto">
            <div
              className="relative w-full md:w-56 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                padding: '2px',
              }}
            >
              <div className="rounded-[14px] overflow-hidden bg-[var(--bg-secondary)]">
                <Image
                  src="/portrait.jpg"
                  alt={siteConfig.name}
                  width={224}
                  height={320}
                  className="w-full object-cover object-top"
                  style={{ aspectRatio: '7/10' }}
                  unoptimized
                />
              </div>
            </div>
          </div>

          {/* Name + tagline + bio */}
          <div className="flex-1">
            <h1
              className="text-[30px] font-bold tracking-tight text-[var(--text-primary)] leading-tight mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {siteConfig.name}
            </h1>
            <p className="text-[15px] text-[var(--text-muted)] mb-3">
              Senior AI Engineer · Bengaluru, India
            </p>
            {/* Stats row */}
            <div className="flex flex-wrap gap-4 mb-6">
              <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                6+ years in AI/ML
              </span>
              <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-violet)' }} />
                19K LinkedIn followers
              </span>
              <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-blue)' }} />
                ConnectWise
              </span>
            </div>
            {/* Bio */}
            <p className="text-[17px] leading-[1.85] text-[var(--text-secondary)] whitespace-pre-line">
              {siteConfig.bio}
            </p>
          </div>
        </div>
      </section>

      {/* Social links */}
      <section className="animate-fade-up delay-1 -mt-8">
        <div className="flex gap-3">
          {Object.entries(siteConfig.social).map(([platform, url]) => (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-all"
            >
              {platform === 'twitter' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              )}
              {platform === 'github' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              )}
              {platform === 'linkedin' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              )}
            </a>
          ))}
          <a
            href={`mailto:${siteConfig.email}`}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
          </a>
        </div>
      </section>

      {/* Skills */}
      <section className="animate-fade-up delay-2">
        <h2
          className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Skills & Technologies
        </h2>
        <div className="flex flex-wrap gap-2">
          {siteConfig.skills.map((skill) => (
            <span
              key={skill.label}
              className={`px-3 py-1 rounded-full text-[12.5px] font-medium ${skillColors[skill.color] ?? skillColors.blue}`}
            >
              {skill.label}
            </span>
          ))}
        </div>
      </section>

      {/* Experience */}
      <section className="animate-fade-up delay-3">
        <h2
          className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Experience
        </h2>
        <div className="space-y-6">
          {siteConfig.work.map((job, i) => (
            <div
              key={i}
              className={`pl-4 border-l-2 ${companyAccents[i % companyAccents.length]}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                <div>
                  <span
                    className="text-[15.5px] font-semibold text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {job.company}
                  </span>
                  <span className="text-[var(--text-muted)] mx-2">·</span>
                  <span className="text-[14px] text-[var(--text-secondary)]">{job.role}</span>
                </div>
                <span className="text-[12.5px] text-[var(--text-muted)] whitespace-nowrap">{job.period}</span>
              </div>
              {job.location && (
                <p className="text-[12.5px] text-[var(--text-muted)] mb-3">{job.location}</p>
              )}
              <ul className="space-y-1.5">
                {job.highlights.map((h, j) => (
                  <li key={j} className="flex gap-2 text-[13.5px] text-[var(--text-secondary)] leading-relaxed">
                    <span className="mt-[6px] w-1 h-1 rounded-full bg-[var(--text-muted)] flex-shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="animate-fade-up delay-4">
        <h2
          className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)] mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Education
        </h2>
        <div className="space-y-4">
          {siteConfig.education.map((edu, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
              <div>
                <div
                  className="text-[15px] font-semibold text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {edu.school}
                </div>
                <div className="text-[13.5px] text-[var(--text-secondary)] mt-0.5">
                  {edu.degree}
                  {edu.grade && <span className="text-[var(--text-muted)] ml-2">· {edu.grade}</span>}
                </div>
              </div>
              <span className="text-[12.5px] text-[var(--text-muted)] whitespace-nowrap">{edu.period}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
