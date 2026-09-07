import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import styles from './mdx.module.css'

/**
 * The component map handed to <MDXRemote> for a lesson body.
 *
 * The lesson MDX is plain markdown — no custom tags — so nothing here
 * adds new elements to the content. It only reshapes the two standard
 * ones that need real markup: a numbered h2, and a table that has to
 * scroll on a narrow screen. Everything else (p, ul, ol, blockquote,
 * pre, code) is left bare for .learn-prose to style.
 *
 * Server components throughout — none of this needs the browser.
 */

/** Matches a heading that opens with its section number: "3. Context windows". */
const LEADING_NUMBER = /^(\d+)\.\s+([\s\S]*)$/

/**
 * Pulls the leading "N. " off a heading's text so the number can go in a
 * badge. Handles the plain-string case and the case where the heading
 * starts with text but also contains inline markup, e.g. `## 2. Using
 * \`temperature\``. Returns a null number when there is no prefix, and the
 * caller falls back to an ordinary heading.
 */
function splitLeadingNumber(children: ReactNode): { number: string | null; rest: ReactNode } {
  if (typeof children === 'string') {
    const match = LEADING_NUMBER.exec(children)
    return match ? { number: match[1], rest: match[2] } : { number: null, rest: children }
  }

  if (Array.isArray(children) && typeof children[0] === 'string') {
    const match = LEADING_NUMBER.exec(children[0])
    if (match) {
      return { number: match[1], rest: [match[2], ...children.slice(1)] }
    }
  }

  return { number: null, rest: children }
}

/** Anything that isn't an absolute URL or a protocol link stays inside the app. */
function isInternal(href: string): boolean {
  return href.startsWith('/')
}

function Heading2({ children, ...props }: ComponentProps<'h2'>) {
  const { number, rest } = splitLeadingNumber(children)

  if (number === null) {
    return <h2 {...props}>{children}</h2>
  }

  return (
    <h2 {...props} className={styles.section}>
      {/* The number is already in the heading text for a screen reader —
          it reads "3. Context windows" either way — so the badge is
          presentational and the visible text carries the meaning. */}
      <span className={styles.badge} aria-hidden="true">
        {number}
      </span>
      <span>{rest}</span>
    </h2>
  )
}

function Table(props: ComponentProps<'table'>) {
  return (
    <div className={styles.tableScroll}>
      <table {...props} />
    </div>
  )
}

function Anchor({ href, children, ...props }: ComponentProps<'a'>) {
  if (href && isInternal(href)) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    )
  }

  // Same-page anchors (#heading) and external links both stay plain <a>;
  // only the external ones get a new tab.
  const external = Boolean(href) && !href!.startsWith('#')

  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      {...props}
    >
      {children}
    </a>
  )
}

export const mdxComponents = {
  h2: Heading2,
  table: Table,
  a: Anchor,
}
