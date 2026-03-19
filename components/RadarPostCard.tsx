import type { RadarPost } from '@/lib/radar'

interface RadarPostCardProps {
  post: RadarPost
  index: number
}

export default function RadarPostCard({ post, index }: RadarPostCardProps) {
  const label = index === 0 ? 'Latest Pulse' : post.date
  const paragraphs = post.content.trim().split(/\n\n+/)

  return (
    <div className="bg-surface-container p-8 rounded-2xl border border-outline-variant hover:border-primary/30 transition-all group">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-label uppercase tracking-widest text-primary font-bold">
          {label}
        </span>
        {index !== 0 && (
          <span className="text-[10px] font-label text-on-surface-variant/50">{post.date}</span>
        )}
      </div>

      <h3 className="font-headline text-xl font-bold text-on-surface mb-4 tracking-tight">
        {post.title}
      </h3>

      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-on-surface/80 text-[15px] leading-relaxed font-body">
            {p}
          </p>
        ))}
      </div>

      {post.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-label uppercase tracking-widest px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
