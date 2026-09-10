import { Bodoni_Moda, Newsreader } from 'next/font/google'

/**
 * The lesson page's lettering.
 *
 * The rest of /learn is lettered in Archivo Narrow; a lesson is not.
 * A monospaced or signage headline is the costume this section's
 * redesign exists to remove, so the display face here is a real
 * display face and the reading face is one drawn for reading.
 *
 * Bodoni Moda is the display: a modern with the thick-to-thin contrast
 * turned all the way up, which is what makes a headline at 96px look
 * set rather than scaled. Its optical-size axis is loaded, so the title
 * gets the high-contrast cut and a 28px section head gets a sturdier
 * one — the same thing a foundry did with separate display and text
 * sizes. That axis matters more here than it did on paper: a thin
 * hairline reversed out of a near-black ground optically thins further,
 * and the smaller optical sizes are the correction for it.
 *
 * Newsreader is the reading face. Low contrast, open counters, a large
 * x-height and an optical-size axis of its own, so a 20px paragraph
 * gets the cut drawn for 20px. It never competes with the Bodoni above
 * it.
 *
 * Italics for both: the byline and the pull quote need real italics,
 * and a browser-synthesised oblique is exactly the tell this page
 * cannot afford.
 *
 * There is no third face. Figures, labels and code all use --ln-num,
 * the JetBrains Mono that app/layout.tsx already loads for the whole
 * site — which is also what keeps the numbers on this page identical
 * to the numbers on the index sheet.
 */

export const displayFace = Bodoni_Moda({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--lm-display',
})

export const readingFace = Newsreader({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--lm-reading',
})
