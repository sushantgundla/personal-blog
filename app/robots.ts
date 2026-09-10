import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/config'
import { LEARN_ORIGIN, learnSubdomainLive } from '@/lib/learn-domain'

/**
 * One robots.txt, served on every host the site answers on.
 *
 * middleware.ts's matcher skips any path with a dot in it, so `/robots.txt`
 * never reaches it and `learn.sushantgundla.com/robots.txt` gets this exact
 * file — the same way `/sitemap.xml` does. Once the subdomain is live that
 * means a crawler on either host reads the same list, so both addresses of the
 * one sitemap are named: whichever host the crawler is on, one of them is on
 * that host, and app/sitemap.ts puts every learn page in it.
 *
 * With the switch off there is only the main site, so only its sitemap is
 * listed — today's behaviour, unchanged.
 */
export default function robots(): MetadataRoute.Robots {
  const apexSitemap = `${siteConfig.url}/sitemap.xml`

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: learnSubdomainLive ? [apexSitemap, `${LEARN_ORIGIN}/sitemap.xml`] : apexSitemap,
  }
}
