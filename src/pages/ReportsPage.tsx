import { useApp } from '@/context/AppContext'
import { TaskOverview } from '@/components/dashboard/TaskOverview'
import { WorkloadCard } from '@/components/dashboard/WorkloadCard'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { BarChart3 } from 'lucide-react'

export function ReportsPage() {
  const { tasks } = useApp()
  const completed = tasks.filter((t) => t.status === 'DONE').length
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length
  const todo = tasks.filter((t) => t.status === 'TODO').length

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
        </div>
        <p className="text-slate-500 mt-1">Workday analytics and activity overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-slate-900">{todo}</p>
          <p className="text-sm text-slate-500 mt-1">To Do</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-blue-600">{inProgress}</p>
          <p className="text-sm text-slate-500 mt-1">In Progress</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-green-600">{completed}</p>
          <p className="text-sm text-slate-500 mt-1">Completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <TaskOverview />
        <WorkloadCard />
      </div>

      <div className="mt-5">
        <RecentActivity />
      </div>
    </div>
  )
}
