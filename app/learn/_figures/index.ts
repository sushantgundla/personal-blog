/**
 * The figure kit — the shared vocabulary every lesson draws with.
 *
 * Seventy-two lessons are written by seventy-two hands. If each one
 * invents its own drawing the section becomes seventy-two websites,
 * so an author's whole job here is to pick a component and supply
 * data. The manual is ./README.md and it is what a lesson author
 * should be reading rather than this file.
 *
 * Everything below is a server component except <Dial> and <Steps>,
 * which are the two that a reader operates. A lesson with no
 * interactive figure on it still ships no JavaScript of its own.
 *
 * All of these are wired into `lessonComponents` in
 * app/learn/_lesson/mdx.tsx, so a lesson body uses them by name with
 * no import line.
 */

export { Figure } from './Figure'
export type { FigureProps } from './Figure'

export { Flow } from './Flow'
export type { FlowProps, FlowStep, FlowBack } from './Flow'

export { Budget } from './Budget'
export type { BudgetProps, BudgetSegment } from './Budget'

export { Bars } from './Bars'
export type { BarsProps, Bar } from './Bars'

export { Scale } from './Scale'
export type { ScaleProps, ScaleMark } from './Scale'

export { Plot } from './Plot'
export type { PlotProps, PlotPoint } from './Plot'

export { Compare, Panel } from './Compare'
export type { CompareProps, PanelProps } from './Compare'

export { Anatomy } from './Anatomy'
export type { AnatomyProps, AnatomyPart } from './Anatomy'

export { Dial } from './Dial'
export type { DialProps, DialBand } from './Dial'

export { Steps } from './Steps'
export type { StepsProps, Step, StepFact } from './Steps'
