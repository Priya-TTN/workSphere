import { useMemo } from 'react'
import type { Task, TaskContextData } from '@/types'
import { getTaskContext } from '@/services/crossSourceContext'

export function useTaskContext(task: Task | null): TaskContextData | null {
  return useMemo(() => (task ? getTaskContext(task) : null), [task])
}
