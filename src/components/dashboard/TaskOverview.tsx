import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import type { Priority } from '@/types'
import { dashboardCard, dashboardCardPadding, dashboardCardTitle } from './styles'

const priorityColors: Record<Priority, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e',
}

const CHART_SIZE = 108
const RADIUS = 42
const STROKE = 10

export function TaskOverview() {
  const { tasks } = useApp()
  const [hovered, setHovered] = useState<Priority | null>(null)

  const counts = {
    HIGH: tasks.filter((t) => t.priority === 'HIGH').length,
    MEDIUM: tasks.filter((t) => t.priority === 'MEDIUM').length,
    LOW: tasks.filter((t) => t.priority === 'LOW').length,
  }
  const total = tasks.length
  const safeTotal = total || 1
  const center = CHART_SIZE / 2
  const circumference = 2 * Math.PI * RADIUS

  const segments: { priority: Priority; count: number; offset: number }[] = []
  let offset = 0
  ;(['HIGH', 'MEDIUM', 'LOW'] as Priority[]).forEach((p) => {
    segments.push({ priority: p, count: counts[p], offset })
    offset += (counts[p] / safeTotal) * circumference
  })

  return (
    <div className={`${dashboardCard} ${dashboardCardPadding} h-full`}>
      <h3 className={`${dashboardCardTitle} mb-5`}>Task Overview</h3>

      <div className="flex items-center gap-5 lg:gap-6">
        <div className="relative shrink-0" style={{ width: CHART_SIZE, height: CHART_SIZE }}>
          <svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
            <circle
              cx={center}
              cy={center}
              r={RADIUS}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={STROKE}
            />
            {segments.map((seg) => {
              const pct = seg.count / safeTotal
              const dash = pct * circumference
              const gap = circumference - dash
              const rotation = (seg.offset / circumference) * 360 - 90
              const isHovered = hovered === seg.priority
              return (
                <circle
                  key={seg.priority}
                  cx={center}
                  cy={center}
                  r={RADIUS}
                  fill="none"
                  stroke={priorityColors[seg.priority]}
                  strokeWidth={isHovered ? STROKE + 2 : STROKE}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeLinecap="round"
                  transform={`rotate(${rotation} ${center} ${center})`}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHovered(seg.priority)}
                  onMouseLeave={() => setHovered(null)}
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[22px] font-bold text-slate-900 leading-none tabular-nums">{total}</span>
            <span className="text-[10px] text-slate-400 mt-1">Total Tasks</span>
          </div>
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          {(['HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((p) => (
            <div
              key={p}
              className="flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: priorityColors[p] }}
                />
                <span className="text-[12px] text-slate-600 truncate">
                  {p === 'HIGH' ? 'High' : p === 'MEDIUM' ? 'Medium' : 'Low'} Priority
                </span>
              </div>
              <span className="text-[13px] font-semibold text-slate-800 tabular-nums ml-2">{counts[p]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
