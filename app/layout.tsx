import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { siteConfig } from '@/lib/config'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Sushant Gundla — Technical Lead AI/ML | Builder & Writer',
    template: `%s — Sushant Gundla`,
  },
  description: 'Sushant Gundla — Technical Lead for AI/ML. Building agentic AI systems, RAG frameworks, and LLM pipelines at scale. Articles on AI engineering and agentic architectures.',
  keywords: ['Sushant Gundla', 'Sushant', 'Gundla', 'AI/ML', 'Technical Lead', 'Agentic AI', 'RAG', 'LLM', 'Machine Learning Engineer'],
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Sushant Gundla — Technical Lead AI/ML',
    description: 'Sushant Gundla — Building agentic AI systems, RAG frameworks, and LLM pipelines at scale.',
    url: siteConfig.url,
    siteName: 'Sushant Gundla',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sushant Gundla — Technical Lead AI/ML',
    description: 'Sushant Gundla — Building agentic AI systems, RAG frameworks, and LLM pipelines at scale.',
    creator: '@sushantgundla',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Sushant Gundla',
    alternateName: ['Sushant', 'Gundla'],
    url: siteConfig.url,
    email: siteConfig.email,
    jobTitle: 'Technical Lead - AI/ML & Innovation',
    worksFor: { '@type': 'Organization', name: 'PDI Technologies' },
    knowsAbout: ['Artificial Intelligence', 'Machine Learning', 'Agentic AI', 'RAG', 'LLMs', 'NLP'],
    sameAs: [
      siteConfig.social.twitter,
      siteConfig.social.github,
      siteConfig.social.linkedin,
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Sushant Gundla',
    url: siteConfig.url,
    author: { '@type': 'Person', name: 'Sushant Gundla' },
  },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-body antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <Header />
          <main className="pt-32 pb-20 max-w-7xl mx-auto px-8">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
