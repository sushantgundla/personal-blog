'use client'

import { useState } from 'react'
import type { RadarPost, RadarPick } from '@/lib/radar'
import RadarPostCard from '@/components/RadarPostCard'
import RadarPickCard from '@/components/RadarPickCard'

interface RadarTabsProps {
  posts: RadarPost[]
  picks: RadarPick[]
}

const activeItems = [
  { category: 'Learning', value: 'Multi-agent orchestration & tool-use patterns' },
  { category: 'Reading', value: 'Designing Data-Intensive Applications' },
  { category: 'Building', value: 'Agentic AI products at PDI Technologies' },
  { category: 'Exploring', value: 'Diffusion models & latent consistency' },
]

export default function RadarTabs({ posts, picks }: RadarTabsProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'picks' | 'active'>('posts')

  const tabClass = (tab: typeof activeTab) =>
    tab === activeTab
      ? 'px-6 py-2 rounded-lg bg-surface-container-high text-primary font-headline text-xs font-bold shadow-lg uppercase'
      : 'px-6 py-2 rounded-lg text-on-surface/50 hover:text-on-surface font-headline text-xs font-bold transition-colors uppercase'

  return (
    <>
      <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant w-fit mb-8">
        <button className={tabClass('posts')} onClick={() => setActiveTab('posts')}>
          Posts
        </button>
        <button className={tabClass('picks')} onClick={() => setActiveTab('picks')}>
          Picks
        </button>
        <button className={tabClass('active')} onClick={() => setActiveTab('active')}>
          Active
        </button>
      </div>

      {activeTab === 'posts' && (
        <div className="grid gap-6">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <RadarPostCard key={post.slug} post={post} index={index} />
            ))
          ) : (
            <p className="text-on-surface-variant text-sm py-12 text-center">No posts yet.</p>
          )}
        </div>
      )}

      {activeTab === 'picks' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {picks.length > 0 ? (
            picks.map((pick, index) => (
              <RadarPickCard key={pick.slug} pick={pick} index={index} />
            ))
          ) : (
            <p className="text-on-surface-variant text-sm py-12 text-center">No picks yet.</p>
          )}
        </div>
      )}

      {activeTab === 'active' && (
        <div className="grid gap-6 md:grid-cols-2">
          {activeItems.map((item) => (
            <div
              key={item.category}
              className="bg-surface-container p-8 rounded-2xl border border-outline-variant/20"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-label text-[11px] uppercase tracking-widest text-primary font-bold">
                  {item.category}
                </span>
              </div>
              <p className="text-on-surface text-lg font-medium leading-snug">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
