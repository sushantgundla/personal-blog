import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-headline text-8xl font-bold tracking-tighter text-on-surface mb-4">
        404
      </h1>
      <p className="text-on-surface-variant text-lg mb-10 max-w-md mx-auto">
        This page doesn't exist, or it wandered off somewhere.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-primary text-white font-label text-sm font-semibold tracking-wide hover:bg-primary/90 transition-colors"
      >
        Go home
      </Link>
    </div>
  )
}
