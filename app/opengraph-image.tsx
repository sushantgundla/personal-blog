import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/config'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = `${siteConfig.name}, Technical Lead, AI/ML. Building agentic AI systems, RAG frameworks, and LLM pipelines at scale.`

export default async function Image() {
  const [role, ...rest] = siteConfig.tagline.split('. ')
  const subline = rest.join('. ')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#0a0a0a',
          color: '#e5e2e1',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '64px',
            height: '6px',
            borderRadius: '3px',
            backgroundColor: '#FF6B2B',
            marginBottom: '40px',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: '96px',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}
        >
          <span>Sushant</span>
          <span style={{ color: '#FF6B2B' }}>Gundla</span>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '32px',
            fontWeight: 600,
            marginTop: '36px',
            color: '#e5e2e1',
          }}
        >
          {role}
        </div>
        {subline && (
          <div
            style={{
              display: 'flex',
              fontSize: '24px',
              marginTop: '12px',
              color: '#a9a9a9',
            }}
          >
            {subline}
          </div>
        )}
      </div>
    ),
    {
      ...size,
    }
  )
}
