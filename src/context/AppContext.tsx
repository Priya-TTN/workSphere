import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Task, Activity } from '@/types'
import tasksData from '@/data/tasks.json'
import activitiesData from '@/data/activities.json'
import { getTomorrowDate } from '@/services/workloadCalculator'

interface AppContextType {
  tasks: Task[]
  activities: Activity[]
  updateTaskStatus: (taskId: string, status: Task['status']) => void
  deferTasksToTomorrow: (taskIds: string[]) => void
  addActivity: (activity: Activity) => void
  resetAppState: () => void
  startWorkingTaskId: string | null
  setStartWorkingTaskId: (id: string | null) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(tasksData as Task[])
  const [activities, setActivities] = useState<Activity[]>(activitiesData as Activity[])
  const [startWorkingTaskId, setStartWorkingTaskId] = useState<string | null>(null)

  const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)))
  }, [])

  const deferTasksToTomorrow = useCallback((taskIds: string[]) => {
    const tomorrow = getTomorrowDate()
    setTasks((prev) =>
      prev.map((t) => (taskIds.includes(t.id) ? { ...t, deadline: tomorrow } : t))
    )
  }, [])

  const addActivity = useCallback((activity: Activity) => {
    setActivities((prev) => [activity, ...prev])
  }, [])

  const resetAppState = useCallback(() => {
    setTasks(tasksData as Task[])
    setActivities(activitiesData as Activity[])
    setStartWorkingTaskId(null)
  }, [])

  return (
    <AppContext.Provider
      value={{
        tasks,
        activities,
        updateTaskStatus,
        deferTasksToTomorrow,
        addActivity,
        resetAppState,
        startWorkingTaskId,
        setStartWorkingTaskId,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
