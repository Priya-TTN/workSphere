import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Task, Activity } from '@/types'
import { getTomorrowDate } from '@/services/workloadCalculator'
import initialTasksData from '@/data/tasks.json'

interface AppContextType {
  tasks: Task[]
  activities: Activity[]
  addTask: (task: Omit<Task, 'id'>) => void
  updateTaskStatus: (taskId: string, status: Task['status']) => void
  deleteTask: (taskId: string) => void
  deferTasksToTomorrow: (taskIds: string[]) => void
  addActivity: (activity: Activity) => void
  resetAppState: () => void
  startWorkingTaskId: string | null
  setStartWorkingTaskId: (id: string | null) => void
}

const AppContext = createContext<AppContextType | null>(null)

const TASKS_KEY = 'workpilot_tasks'
const ACTIVITIES_KEY = 'workpilot_activities'

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem(TASKS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Task[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
      return initialTasksData as Task[]
    } catch {
      return initialTasksData as Task[]
    }
  })

  const [activities, setActivities] = useState<Activity[]>(() => {
    try {
      const stored = localStorage.getItem(ACTIVITIES_KEY)
      return stored ? (JSON.parse(stored) as Activity[]) : []
    } catch {
      return []
    }
  })

  const [startWorkingTaskId, setStartWorkingTaskId] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities))
  }, [activities])

  const addTask = useCallback((newTasksData: Omit<Task, 'id'>) => {
    const id = `task-${Date.now().toString().slice(-4)}`
    const newTask: Task = { ...newTasksData, id }
    setTasks((prev) => [newTask, ...prev])
  }, [])

  const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)))
  }, [])

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
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
    localStorage.removeItem(TASKS_KEY)
    localStorage.removeItem(ACTIVITIES_KEY)
    setTasks([])
    setActivities([])
    setStartWorkingTaskId(null)
  }, [])

  return (
    <AppContext.Provider
      value={{
        tasks,
        activities,
        addTask,
        updateTaskStatus,
        deleteTask,
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
