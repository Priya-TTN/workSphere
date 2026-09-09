import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { TaskCard } from '@/components/shared/TaskCard'
import { ContextPanel } from '@/components/shared/ContextPanel'
import { useTaskContext } from '@/hooks/useTaskContext'
import type { Priority, Task } from '@/types'

type StatusFilter = Task['status'] | 'ALL'

export function TasksPage() {
  const { tasks, updateTaskStatus } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const selectedId = searchParams.get('selected')

  const filtered = tasks.filter((t) => {
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false
    return true
  })

  const selectedTask =
    selectedId && filtered.some((t) => t.id === selectedId)
      ? tasks.find((t) => t.id === selectedId) ?? null
      : null
  const taskContext = useTaskContext(selectedTask)

  const handleSelectTask = (task: Task) => {
    setSearchParams({ selected: task.id }, { replace: true })
  }

  const handleStatusChange = (status: Task['status']) => {
    if (!selectedTask) return
    updateTaskStatus(selectedTask.id, status)
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Tasks</h2>
        <p className="text-slate-500 mt-1">Manage and prioritize your work items</p>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              priorityFilter === p
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p === 'ALL' ? 'All Priorities' : `${p.charAt(0) + p.slice(1).toLowerCase()} Priority`}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['ALL', 'TODO', 'IN_PROGRESS', 'DONE'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s === 'ALL' ? 'All Statuses' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <p className="text-sm text-slate-500">No tasks match the current filters.</p>
            </div>
          ) : (
            filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                selected={selectedTask?.id === task.id}
                onClick={() => handleSelectTask(task)}
              />
            ))
          )}
        </div>

        {selectedTask && taskContext && (
          <ContextPanel
            context={taskContext}
            task={selectedTask}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </div>
  )
}
