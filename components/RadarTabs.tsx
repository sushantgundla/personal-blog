'use client'

import { useState } from 'react'
import { RadarPostCard } from '@/components/RadarPostCard'
import { RadarPickCard } from '@/components/RadarPickCard'
import type { RadarPost, RadarPick } from '@/lib/radar'

export function RadarTabs({ posts, picks }: { posts: RadarPost[]; picks: RadarPick[] }) {
  const [tab, setTab] = useState<'posts' | 'picks'>('posts')

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
        <button
          onClick={() => setTab('posts')}
          className={`px-4 py-2.5 text-[13.5px] font-medium transition-colors relative ${
            tab === 'posts'
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Posts
          {tab === 'posts' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]" />
          )}
        </button>
        <button
          onClick={() => setTab('picks')}
          className={`px-4 py-2.5 text-[13.5px] font-medium transition-colors relative ${
            tab === 'picks'
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Picks
          {tab === 'picks' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]" />
          )}
        </button>
      </div>

      {/* Content */}
      {tab === 'posts' && (
        <div>
          {posts.length > 0 ? (
            posts.map((post, i) => (
              <RadarPostCard key={post.slug} post={post} index={i} />
            ))
          ) : (
            <div className="py-16 text-center">
              <p className="text-[var(--text-muted)]">No posts yet. Check back soon.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'picks' && (
        <div>
          {picks.length > 0 ? (
            picks.map((pick, i) => (
              <RadarPickCard key={pick.slug} pick={pick} index={i} />
            ))
          ) : (
            <div className="py-16 text-center">
              <p className="text-[var(--text-muted)]">No picks yet. Check back soon.</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
