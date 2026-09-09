import { useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import {
  calculateWorkload,
  getDeferRecommendations,
  type WorkloadSummary,
  type DeferRecommendation,
} from '@/services/workloadCalculator'

export function useWorkload(): {
  summary: WorkloadSummary
  recommendation: DeferRecommendation
} {
  const { tasks } = useApp()

  const summary = useMemo(() => calculateWorkload(tasks), [tasks])
  const recommendation = useMemo(
    () => getDeferRecommendations(tasks, summary.deficitMinutes),
    [tasks, summary.deficitMinutes]
  )

  return { summary, recommendation }
}
