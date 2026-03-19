import { siteConfig } from '@/lib/config'

export function Footer() {
  return (
    <footer className="w-full py-20 border-t border-primary/10" style={{ backgroundColor: 'var(--footer-bg)' }}>
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        {/* Left: Copyright */}
        <span className="font-mono text-[10px] tracking-widest uppercase text-on-surface/40">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </span>

        {/* Right: Social links */}
        <div className="flex items-center gap-6">
          <a
            href={siteConfig.social.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] tracking-widest uppercase text-on-surface/40 hover:text-primary transition-colors"
          >
            X
          </a>
          <a
            href={siteConfig.social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] tracking-widest uppercase text-on-surface/40 hover:text-primary transition-colors"
          >
            GitHub
          </a>
          <a
            href={siteConfig.social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] tracking-widest uppercase text-on-surface/40 hover:text-primary transition-colors"
          >
            LinkedIn
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className="font-mono text-[10px] tracking-widest uppercase text-on-surface/40 hover:text-primary transition-colors"
          >
            Email
          </a>
        </div>
      </div>
    </footer>
  )
}
