import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/lib/config'
import { V4Header } from './_components/V4Header'
import './v4.css'

export const metadata: Metadata = {
  title: 'Sushant Gundla · v4',
  description: 'Preview of the redesigned personal site: Bold Signal.',
}

export default function V4Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="v4-root v4-grain min-h-screen bg-surface text-on-surface font-body flex flex-col">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800;9..144,900&display=swap"
        rel="stylesheet"
      />

      <V4Header />
      <main className="flex-1">{children}</main>

      <footer className="border-t border-outline-variant/60 mt-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="v4-display text-lg font-black tracking-tight text-on-surface">
              Sushant Gundla
            </p>
            <p className="text-on-surface-variant text-sm mt-1">
              Technical Lead, AI/ML · Bengaluru, India
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">GitHub</a>
            <a href={siteConfig.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">LinkedIn</a>
            <a href={siteConfig.social.twitter} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">X</a>
            <a href={`mailto:${siteConfig.email}`} className="text-on-surface-variant hover:text-primary transition-colors">Email</a>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-5 md:px-8 pb-10">
          <Link href="/" className="text-on-surface-variant/50 text-xs hover:text-on-surface-variant transition-colors">
            ← Back to current site
          </Link>
        </div>
      </footer>
    </div>
  )
}
