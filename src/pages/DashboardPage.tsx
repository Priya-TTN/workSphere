import { GreetingHeader } from '@/components/dashboard/GreetingHeader'
import { SourceSummaryCard } from '@/components/dashboard/SourceSummaryCard'
import { AIRecommendedPlan } from '@/components/dashboard/AIRecommendedPlan'
import { NextActionCard } from '@/components/dashboard/NextActionCard'
import { CalendarCard } from '@/components/dashboard/CalendarCard'
import { DeadlineCard } from '@/components/dashboard/DeadlineCard'
import { TaskOverview } from '@/components/dashboard/TaskOverview'
import { WorkloadCard } from '@/components/dashboard/WorkloadCard'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { AIQuoteBanner } from '@/components/dashboard/AIQuoteBanner'

export function DashboardPage() {
  return (
    <div className="px-4 py-5 sm:px-5 lg:px-7 lg:py-6 max-w-[1440px] mx-auto">
      <GreetingHeader />

      {/* Source Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-3.5 mb-5 lg:mb-6">
        <SourceSummaryCard type="emails" count={7} subtitle="3 need action" />
        <SourceSummaryCard type="teams" count={4} subtitle="2 mentions for you" />
        <SourceSummaryCard type="jira" count={5} subtitle="2 high priority" />
        <SourceSummaryCard type="meetings" count={3} subtitle="Next at 10:30 AM" />
        <SourceSummaryCard type="excel" count={2} subtitle="1 needs review" />
        <SourceSummaryCard type="documents" count={4} subtitle="2 new updates" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] gap-4 lg:gap-5 mb-4 lg:mb-5">
        <div className="space-y-4 lg:space-y-5 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            <AIRecommendedPlan />
            <NextActionCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            <TaskOverview />
            <WorkloadCard />
          </div>
          <RecentActivity />
        </div>

        <div className="space-y-4 lg:space-y-5 min-w-0">
          <CalendarCard />
          <DeadlineCard />
        </div>
      </div>

      <AIQuoteBanner />
    </div>
  )
}
