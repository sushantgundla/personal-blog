'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { gradeFor, lifetimeCorrect, readProgress, type Progress } from '@/lib/atlas/learn/progress'
import styles from './plate.module.css'

/**
 * The one piece of live content in FloorBand.tsx — a visitor's own grade,
 * read straight off the ladder in lib/atlas/learn/progress.ts (the same
 * source of truth app/atlas/learn/_components/GradeSeal.tsx uses).
 *
 * `readProgress()` only ever runs inside `useEffect`, never during render —
 * see GradeSeal.tsx's own comment for why: the server has no localStorage,
 * so rendering from it directly would make the server HTML and the first
 * client render disagree, and React discards the mismatched subtree. Until
 * the record loads this shows the honest zero-state, `gradeFor(0)` —
 * "Apprentice" — which is also exactly what a first-time visitor with no
 * runs actually holds, so there is nothing to reconcile once the effect
 * does run.
 */
export function FloorGradeChip() {
  const [progress, setProgress] = useState<Progress | null>(null)

  useEffect(() => {
    setProgress(readProgress())
  }, [])

  const correct = progress ? lifetimeCorrect(progress) : 0
  const grade = gradeFor(correct)

  return (
    <Link href="/atlas/learn" className={styles.floorBandGrade}>
      <span aria-hidden="true" className={styles.floorBandGradeMark}>
        ◉
      </span>
      Grade — {grade.name}
    </Link>
  )
}
