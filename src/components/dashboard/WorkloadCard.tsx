import { useState } from 'react'
import { AlertTriangle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Toast } from '@/components/ui/Toast'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { AIBadge } from '@/components/ui/AIBadge'
import { useApp } from '@/context/AppContext'
import { useWorkload } from '@/hooks/useWorkload'
import { formatDuration } from '@/services/workloadCalculator'
import type { Priority } from '@/types'
import { dashboardCard, dashboardCardPadding, dashboardCardTitle } from './styles'

export function WorkloadCard() {
  const [modalOpen, setModalOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const { deferTasksToTomorrow, addActivity } = useApp()
  const { summary, recommendation } = useWorkload()

  const barMax = Math.max(summary.workingMinutes, summary.plannedMinutes, 1)
  const plannedPct = (summary.plannedMinutes / barMax) * 100
  const availablePct = (summary.availableMinutes / barMax) * 100

  const handleMoveTasks = () => {
    const taskIds = recommendation.suggestions.map((s) => s.task.id)
    deferTasksToTomorrow(taskIds)
    addActivity({
      id: `activity-${Date.now()}`,
      type: 'task',
      title: 'Workload rebalanced',
      description: `Moved ${taskIds.length} task(s) to tomorrow`,
      timestamp: new Date().toISOString(),
      source: 'WorkPilot AI',
    })
    setModalOpen(false)
    setToastVisible(true)
  }

  return (
    <>
      <div className={`${dashboardCard} ${dashboardCardPadding} h-full`}>
        <h3 className={`${dashboardCardTitle} mb-5`}>Workload vs Availability</h3>

        <div className="space-y-3.5 mb-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">Planned Work</span>
              <span className="text-[13px] font-bold text-slate-800 tabular-nums">
                {summary.plannedHoursLabel}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-500 transition-all duration-500"
                style={{ width: `${plannedPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">Available Today</span>
              <span className="text-[13px] font-bold text-slate-800 tabular-nums">
                {summary.availableHoursLabel}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${availablePct}%` }}
              />
            </div>
          </div>
        </div>

        {summary.isOverloaded && (
          <>
            <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3 mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Warning</p>
                  <p className="text-[11px] text-amber-700/90 mt-0.5 leading-relaxed">
                    You have {summary.plannedHoursLabel.replace('h', ' hours')} of work but only{' '}
                    {summary.availableHoursLabel.replace('h', ' hours')} available.
                  </p>
                </div>
              </div>
            </div>

            <AIBadge label="AI Recommendation" className="mb-2" />
            <p className="text-[12px] text-slate-600 mb-4 leading-relaxed">
              Consider moving {recommendation.suggestions.length} low-priority task
              {recommendation.suggestions.length !== 1 ? 's' : ''} to tomorrow.
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="w-full h-9 text-[13px]"
              disabled={recommendation.suggestions.length === 0}
            >
              Review Suggestions
            </Button>
          </>
        )}

        {!summary.isOverloaded && (
          <div className="rounded-xl bg-green-50/80 border border-green-200/80 p-3">
            <p className="text-[12px] text-green-700 leading-relaxed">
              Your workload is balanced for today. You have enough time for planned tasks.
            </p>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="AI Workload Recommendation"
        description="Move these tasks to tomorrow to balance your workload."
        className="max-w-md"
      >
        <div className="flex items-center gap-1.5 mb-4">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <AIBadge label="AI Recommendation" />
        </div>

        <p className="text-sm font-medium text-slate-800 mb-3">Move these tasks to tomorrow:</p>

        <ol className="space-y-2.5 mb-4">
          {recommendation.suggestions.map((item, index) => (
            <li
              key={item.task.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs font-semibold text-slate-400 w-4 shrink-0">{index + 1}.</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.task.title}</p>
                  <p className="text-xs text-slate-400">{formatDuration(item.minutes)}</p>
                </div>
              </div>
              <PriorityBadge priority={item.task.priority as Priority} showLabel={false} />
            </li>
          ))}
        </ol>

        {recommendation.suggestions.length > 0 && (
          <div className="rounded-xl bg-purple-50 border border-purple-100 px-4 py-3 mb-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total recovered</p>
            <p className="text-lg font-bold text-purple-700 mt-0.5">{recommendation.totalRecoveredLabel}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleMoveTasks} disabled={recommendation.suggestions.length === 0}>
            Move Tasks
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
            Keep Schedule
          </Button>
        </div>
      </Modal>

      <Toast
        message="Tasks moved to tomorrow. Workload updated."
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </>
  )
}
