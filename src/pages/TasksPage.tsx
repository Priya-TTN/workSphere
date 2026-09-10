import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { TaskCard } from '@/components/shared/TaskCard'
import { ContextPanel } from '@/components/shared/ContextPanel'
import { useTaskContext } from '@/hooks/useTaskContext'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Plus } from 'lucide-react'
import type { Priority, Task } from '@/types'

type StatusFilter = Task['status'] | 'ALL'

export function TasksPage() {
  const { tasks, addTask, updateTaskStatus } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('MEDIUM')
  const [newDeadline, setNewDeadline] = useState(new Date().toISOString().split('T')[0])
  const [newHours, setNewHours] = useState('2')

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    addTask({
      title: newTitle.trim(),
      description: newDesc.trim() || 'No description provided.',
      source: 'Internal',
      sourceId: `user-${Date.now()}`,
      priority: newPriority,
      priorityScore: newPriority === 'HIGH' ? 3 : newPriority === 'MEDIUM' ? 2 : 1,
      deadline: newDeadline,
      estimatedMinutes: (parseFloat(newHours) || 2) * 60,
      status: 'TODO',
      linkedItems: [],
      reasons: ['Created by user'],
    })
    setNewTitle('')
    setNewDesc('')
    setIsModalOpen(false)
  }

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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tasks</h2>
          <p className="text-slate-500 mt-1">Manage and prioritize your work items</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
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

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title="Create New Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Task Title</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Implement user authentication"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Task details and description..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Estimated Hours</label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={newHours}
                onChange={(e) => setNewHours(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Deadline Date</label>
            <Input
              type="date"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!newTitle.trim()}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
