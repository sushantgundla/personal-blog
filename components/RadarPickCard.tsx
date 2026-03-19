import { RadarPick } from '@/lib/radar'

const typeLabels: Record<string, { label: string; color: string }> = {
  blog: { label: 'Blog', color: 'var(--accent)' },
  repo: { label: 'Repo', color: 'var(--accent-violet)' },
  tool: { label: 'Tool', color: 'var(--accent-blue)' },
  model: { label: 'Model', color: 'var(--accent-teal)' },
  paper: { label: 'Paper', color: 'var(--accent-green)' },
  resource: { label: 'Resource', color: 'var(--accent-pink)' },
}

export function RadarPickCard({ pick, index }: { pick: RadarPick; index: number }) {
  const typeInfo = typeLabels[pick.type] || typeLabels.resource

  return (
    <a
      href={pick.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block py-5 border-b border-[var(--border)] animate-fade-up delay-${index + 1}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span
              className="px-2 py-0.5 rounded text-[10.5px] font-semibold uppercase tracking-wide text-white"
              style={{ background: typeInfo.color }}
            >
              {typeInfo.label}
            </span>
            <h3
              className="text-[15.5px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-snug truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {pick.title}
            </h3>
          </div>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 mb-2">
            {pick.description}
          </p>
          <div className="flex items-center gap-3 text-[12px] text-[var(--text-muted)]">
            <time>{pick.date}</time>
            {pick.tags.length > 0 && (
              <>
                <span className="opacity-30">·</span>
                {pick.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>
        <svg
          className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all mt-2 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </div>
    </a>
  )
}
