import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ArrowRight, Plus, PieChart } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import type { Priority, TaskStatus } from '@/types'
import { dashboardCard, dashboardCardPadding, dashboardCardTitle } from './styles'

const priorityColors: Record<Priority, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
}

const statusColors: Record<TaskStatus, string> = {
  TODO: '#64748b',
  IN_PROGRESS: '#3b82f6',
  DONE: '#10b981',
}

const CHART_SIZE = 112
const RADIUS = 42
const STROKE = 10

export function TaskOverview() {
  const { tasks, addTask } = useApp()
  const [hoveredPriority, setHoveredPriority] = useState<Priority | null>(null)
  const [hoveredStatus, setHoveredStatus] = useState<TaskStatus | null>(null)
  const [viewMode, setViewMode] = useState<'priority' | 'status'>('priority')

  const total = tasks.length
  const completedCount = tasks.filter((t) => t.status === 'DONE').length
  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0

  // Priority counts
  const priorityCounts = {
    HIGH: tasks.filter((t) => t.priority === 'HIGH').length,
    MEDIUM: tasks.filter((t) => t.priority === 'MEDIUM').length,
    LOW: tasks.filter((t) => t.priority === 'LOW').length,
  }

  // Status counts
  const statusCounts = {
    TODO: tasks.filter((t) => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    DONE: tasks.filter((t) => t.status === 'DONE').length,
  }

  const center = CHART_SIZE / 2
  const circumference = 2 * Math.PI * RADIUS

  // Calculate Priority Segments (Filter out 0-count segments to avoid SVG dot glitches)
  const activePrioritySegments: { priority: Priority; count: number; dash: number; gap: number; rotation: number }[] = []
  if (total > 0) {
    let currentOffset = 0
    ;(['HIGH', 'MEDIUM', 'LOW'] as Priority[]).forEach((p) => {
      const cnt = priorityCounts[p]
      if (cnt > 0) {
        const pct = cnt / total
        const dash = pct * circumference
        const gap = circumference - dash
        const rotation = (currentOffset / circumference) * 360 - 90
        activePrioritySegments.push({ priority: p, count: cnt, dash, gap, rotation })
        currentOffset += dash
      }
    })
  }

  // Calculate Status Segments
  const activeStatusSegments: { status: TaskStatus; count: number; dash: number; gap: number; rotation: number }[] = []
  if (total > 0) {
    let currentOffset = 0
    ;(['IN_PROGRESS', 'TODO', 'DONE'] as TaskStatus[]).forEach((s) => {
      const cnt = statusCounts[s]
      if (cnt > 0) {
        const pct = cnt / total
        const dash = pct * circumference
        const gap = circumference - dash
        const rotation = (currentOffset / circumference) * 360 - 90
        activeStatusSegments.push({ status: s, count: cnt, dash, gap, rotation })
        currentOffset += dash
      }
    })
  }

  const handleQuickCreate = () => {
    addTask({
      title: 'Review production metrics & sprint backlog',
      description: 'Created via Task Overview dashboard action',
      source: 'Internal',
      sourceId: 'overview',
      priority: 'HIGH',
      priorityScore: 90,
      deadline: new Date().toISOString().split('T')[0],
      estimatedMinutes: 45,
      status: 'TODO',
      reasons: ['High priority focus item'],
      linkedItems: [],
    })
  }

  return (
    <div className={`${dashboardCard} ${dashboardCardPadding} flex flex-col justify-between h-full`}>
      <div>
        {/* Card Header & View Switcher */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className={dashboardCardTitle}>Task Overview</h3>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('priority')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'priority'
                  ? 'bg-white text-slate-800 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Priority
            </button>
            <button
              type="button"
              onClick={() => setViewMode('status')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'status'
                  ? 'bg-white text-slate-800 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Status
            </button>
          </div>
        </div>

        {total === 0 ? (
          /* Empty Slate State */
          <div className="py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 border border-purple-100 mb-3">
              <PieChart className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No Active Tasks</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[220px] mx-auto">
              Your task pipeline is empty. Add a task to start tracking workload.
            </p>
            <button
              type="button"
              onClick={handleQuickCreate}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Sample Task
            </button>
          </div>
        ) : (
          /* Active Donut Chart & Breakdown */
          <div className="flex items-center gap-5 lg:gap-6 my-1">
            <div className="relative shrink-0" style={{ width: CHART_SIZE, height: CHART_SIZE }}>
              <svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
                {/* Background Ring Track */}
                <circle
                  cx={center}
                  cy={center}
                  r={RADIUS}
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth={STROKE}
                />

                {/* Priority Segments */}
                {viewMode === 'priority' &&
                  activePrioritySegments.map((seg) => {
                    const isHovered = hoveredPriority === seg.priority
                    return (
                      <circle
                        key={seg.priority}
                        cx={center}
                        cy={center}
                        r={RADIUS}
                        fill="none"
                        stroke={priorityColors[seg.priority]}
                        strokeWidth={isHovered ? STROKE + 3 : STROKE}
                        strokeDasharray={`${seg.dash} ${seg.gap}`}
                        transform={`rotate(${seg.rotation} ${center} ${center})`}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredPriority(seg.priority)}
                        onMouseLeave={() => setHoveredPriority(null)}
                      />
                    )
                  })}

                {/* Status Segments */}
                {viewMode === 'status' &&
                  activeStatusSegments.map((seg) => {
                    const isHovered = hoveredStatus === seg.status
                    return (
                      <circle
                        key={seg.status}
                        cx={center}
                        cy={center}
                        r={RADIUS}
                        fill="none"
                        stroke={statusColors[seg.status]}
                        strokeWidth={isHovered ? STROKE + 3 : STROKE}
                        strokeDasharray={`${seg.dash} ${seg.gap}`}
                        transform={`rotate(${seg.rotation} ${center} ${center})`}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredStatus(seg.status)}
                        onMouseLeave={() => setHoveredStatus(null)}
                      />
                    )
                  })}
              </svg>

              {/* Donut Center Metrics */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{total}</span>
                <span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                  {total === 1 ? 'Task' : 'Tasks'}
                </span>
              </div>
            </div>

            {/* Side Metric Breakdown */}
            <div className="flex-1 space-y-2 min-w-0">
              {viewMode === 'priority'
                ? (['HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((p) => {
                    const cnt = priorityCounts[p]
                    const pct = Math.round((cnt / total) * 100)
                    return (
                      <div
                        key={p}
                        className="flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                        onMouseEnter={() => setHoveredPriority(p)}
                        onMouseLeave={() => setHoveredPriority(null)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: priorityColors[p] }}
                          />
                          <span className="text-xs font-medium text-slate-700 truncate">
                            {p === 'HIGH' ? 'High' : p === 'MEDIUM' ? 'Medium' : 'Low'} Priority
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="text-xs font-semibold text-slate-800 tabular-nums">{cnt}</span>
                          <span className="text-[11px] text-slate-400 font-mono">({pct}%)</span>
                        </div>
                      </div>
                    )
                  })
                : (['TODO', 'IN_PROGRESS', 'DONE'] as TaskStatus[]).map((s) => {
                    const cnt = statusCounts[s]
                    const pct = Math.round((cnt / total) * 100)
                    const label = s === 'TODO' ? 'To Do' : s === 'IN_PROGRESS' ? 'In Progress' : 'Completed'
                    return (
                      <div
                        key={s}
                        className="flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                        onMouseEnter={() => setHoveredStatus(s)}
                        onMouseLeave={() => setHoveredStatus(null)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: statusColors[s] }}
                          />
                          <span className="text-xs font-medium text-slate-700 truncate">{label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="text-xs font-semibold text-slate-800 tabular-nums">{cnt}</span>
                          <span className="text-[11px] text-slate-400 font-mono">({pct}%)</span>
                        </div>
                      </div>
                    )
                  })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Progress & Link */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">
            <span className="font-semibold text-slate-800">{completedCount}</span> of {total} completed
          </span>
          {total > 0 && <span className="font-mono text-emerald-700 font-semibold">({completionRate}%)</span>}
        </div>

        <Link
          to="/tasks"
          className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-700 transition-colors shrink-0"
        >
          <span>Tasks Page</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
