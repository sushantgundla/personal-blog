import { Archivo_Narrow } from 'next/font/google'

/**
 * The plate's lettering.
 *
 * A drawing is annotated, not typeset: a label has to sit inside a leader
 * callout, beside a 6px stroke, or between two parts that are 40 units
 * apart, and it must not push the drawing around to fit. Draughting
 * lettering has always been a condensed single-stroke gothic for exactly
 * that reason — ISO 3098 and the Leroy sets are both narrow, upright and
 * open at small sizes.
 *
 * Archivo Narrow is that face in a web form, and it is the narrow cut of
 * Archivo, which the rest of this section already uses for signage. So the
 * plate reads as the same publication's drawing office rather than as a
 * different site: same skeleton, set narrow because the annotation needs it.
 *
 * Weights: 400 for the reading matter in the legend, 500 for fine annotation
 * on the drawing, 700 for the h1, the labels and the figures. 600 was loaded
 * and never used; it is gone.
 *
 * Loaded through next/font/google, so it is self-hosted with the build and
 * costs no third-party request. Inter and JetBrains Mono already arrive from
 * app/layout.tsx; this route adds exactly one face.
 */
export const plateFace = Archivo_Narrow({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--pl-face',
})
