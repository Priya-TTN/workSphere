import { GreetingHeader } from '@/components/dashboard/GreetingHeader'
import { SourceSummaryCard } from '@/components/dashboard/SourceSummaryCard'
import { AIRecommendedPlan } from '@/components/dashboard/AIRecommendedPlan'
import { NextActionCard } from '@/components/dashboard/NextActionCard'
import { CalendarCard } from '@/components/dashboard/CalendarCard'
import { EmailInboxCard } from '@/components/dashboard/EmailInboxCard'
import { DeadlineCard } from '@/components/dashboard/DeadlineCard'
import { TaskOverview } from '@/components/dashboard/TaskOverview'
import { WorkloadCard } from '@/components/dashboard/WorkloadCard'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { AIQuoteBanner } from '@/components/dashboard/AIQuoteBanner'
import { useGmail } from '@/context/GmailContext'
import { useGoogleCalendar } from '@/context/GoogleCalendarContext'
import { formatEventTime } from '@/services/googleCalendar'
import { isLikelyActionNeeded } from '@/services/email/meetingHints'

export function DashboardPage() {
  const { isConnected: gmailConnected, messages, unseenCount } = useGmail()
  const { isConnected: calendarConnected, todayEvents } = useGoogleCalendar()

  const emailCount = gmailConnected ? messages.length : 0
  const emailAction = gmailConnected
    ? messages.filter((email) => isLikelyActionNeeded(email.subject, email.bodyText, email.isUnread)).length
    : 0
  const emailSubtitle = gmailConnected
    ? unseenCount > 0
      ? `${unseenCount} unread`
      : `${emailAction} need action`
    : 'Connect Gmail'

  const meetingCount = calendarConnected ? todayEvents.length : 0
  const nextMeeting = calendarConnected
    ? todayEvents[0]
      ? `Next at ${formatEventTime(todayEvents[0].start.dateTime ?? todayEvents[0].start.date) || 'today'}`
      : 'No meetings today'
    : 'Connect Calendar'

  return (
    <div className="px-4 py-5 sm:px-5 lg:px-7 lg:py-6 max-w-[1440px] mx-auto">
      <GreetingHeader />

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-3.5 mb-5 lg:mb-6">
        <SourceSummaryCard type="emails" count={emailCount} subtitle={emailSubtitle} />
        <SourceSummaryCard type="teams" count={0} subtitle="0 mentions for you" />
        <SourceSummaryCard type="jira" count={0} subtitle="0 high priority" />
        <SourceSummaryCard type="meetings" count={meetingCount} subtitle={nextMeeting} />
        <SourceSummaryCard type="excel" count={0} subtitle="0 files" />
        <SourceSummaryCard type="documents" count={0} subtitle="0 updates" />
      </div>

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
          <EmailInboxCard />
          <CalendarCard />
          <DeadlineCard />
        </div>
      </div>

      <AIQuoteBanner />
    </div>
  )
}
