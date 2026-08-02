import type { Metadata } from 'next'
import { projects } from '@/lib/projects'
import { Reveal } from '../_components/Reveal'
import { ProjectsGrid } from './ProjectsGrid'

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Systems, tools, and experiments from the frontier of AI engineering — shipped to production, several under NDA.',
}

/**
 * Server component: owns the page header and metadata. The filter + grid is
 * interactive (button state, dim/emphasize on selection), so it lives in
 * ProjectsGrid, a client component that receives the data as a prop rather
 * than importing it itself — `projects` is a static array so either would be
 * safe, but keeping the data read on the server side matches how the rest of
 * this design pulls from lib/.
 */
export default function ProjectsPage() {
  return (
    <section className="v2-section">
      <div className="v2-wrap">
        <Reveal>
          <span className="v2-eyebrow">Track record</span>
          <h1 className="v2-title">Projects</h1>
          <p className="v2-body v2-muted" style={{ maxWidth: '640px', marginTop: '16px' }}>
            Systems I&apos;ve built and shipped to production — agent platforms, chatbots, RAG
            pipelines, and a language model trained from scratch. Several are under NDA, so
            what&apos;s shown is what they do, not whose logo is on them.
          </p>
        </Reveal>

        <div style={{ marginTop: 'clamp(32px, 4vh, 48px)' }}>
          <ProjectsGrid projects={projects} />
        </div>
      </div>
    </section>
  )
}
