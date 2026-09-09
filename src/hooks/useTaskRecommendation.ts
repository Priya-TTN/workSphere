import { useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { getRecommendedTask, type TaskRecommendation } from '@/services/taskRecommendation'
import teamsData from '@/data/teams.json'
import calendarData from '@/data/calendar.json'
import type { TeamsMessage, CalendarEvent } from '@/types'

export function useTaskRecommendation(): TaskRecommendation | null {
  const { tasks } = useApp()

  return useMemo(
    () => getRecommendedTask(tasks, teamsData as TeamsMessage[], calendarData as CalendarEvent[]),
    [tasks]
  )
}
