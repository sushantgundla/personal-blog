import type { RadarPick } from '@/lib/radar'

interface RadarPickCardProps {
  pick: RadarPick
  index: number
}

const typeColors: Record<string, string> = {
  blog: 'bg-primary/10 text-primary',
  repo: 'bg-secondary/10 text-secondary',
  tool: 'bg-tertiary/10 text-tertiary',
  model: 'bg-primary/20 text-primary',
  paper: 'bg-secondary/20 text-secondary',
  resource: 'bg-tertiary/20 text-tertiary',
}

export default function RadarPickCard({ pick }: RadarPickCardProps) {
  return (
    <a
      href={pick.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-surface-container-low p-6 rounded-xl hover:bg-surface-container-high transition-colors group block"
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-[10px] font-label uppercase tracking-widest px-2 py-0.5 rounded-full ${typeColors[pick.type] || typeColors.resource}`}
        >
          {pick.type}
        </span>
        <svg
          className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
        </svg>
      </div>

      <h3 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">
        {pick.title}
      </h3>

      {pick.description && (
        <p className="mt-1 text-sm text-on-surface-variant line-clamp-2">
          {pick.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        {pick.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pick.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-label uppercase tracking-widest px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <span className="text-[10px] font-label text-on-surface-variant ml-auto">
          {pick.date}
        </span>
      </div>
    </a>
  )
}
