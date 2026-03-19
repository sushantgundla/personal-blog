import { RadarPost } from '@/lib/radar'

export function RadarPostCard({ post, index }: { post: RadarPost; index: number }) {
  return (
    <div className={`py-5 border-b border-[var(--border)] animate-fade-up delay-${index + 1}`}>
      <div className="flex items-start gap-3">
        <div
          className="w-1.5 h-1.5 rounded-full mt-[9px] flex-shrink-0"
          style={{ background: 'var(--accent)' }}
        />
        <div className="flex-1 min-w-0">
          <h3
            className="text-[15.5px] font-semibold text-[var(--text-primary)] leading-snug mb-1.5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {post.title}
          </h3>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-2.5 line-clamp-3">
            {post.content.trim()}
          </p>
          <div className="flex items-center flex-wrap gap-2.5 text-[12px] text-[var(--text-muted)]">
            <time>{post.date}</time>
            {post.tags.length > 0 && (
              <>
                <span className="opacity-30">·</span>
                <div className="flex items-center gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
