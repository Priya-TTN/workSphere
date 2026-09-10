import type { Activity } from '@/types'
import type { CalendarEvent } from '@/types'
import type { GoogleCalendarEvent } from '@/services/googleCalendar'
import type { WorkSnapshot } from '@/services/ai/contextEngine'
import { calculateWorkload, getDeferRecommendations } from '@/services/workloadCalculator'
import { getRecommendedTask, WORKDAY_DATE } from '@/services/taskRecommendation'
import { buildInboxBrief } from '@/services/ai/emailContext'
import { extractAllMailInsights } from '@/services/email/emailExtractor'
import { formatEventTime } from '@/services/googleCalendar'

export interface BuiltInAIResponse {
  answer: string
  type?: 'text' | 'list' | 'activity'
  items?: string[]
  activities?: Activity[]
}

function daysUntilDeadline(deadline: string): number {
  const today = new Date(`${WORKDAY_DATE}T12:00:00`)
  const d = new Date(`${deadline}T12:00:00`)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

function mapGoogleToCalendarEvents(events: GoogleCalendarEvent[]): CalendarEvent[] {
  return events.map((e) => ({
    id: e.id,
    title: e.summary,
    startTime: e.start.dateTime ?? e.start.date ?? '',
    endTime: e.end.dateTime ?? e.end.date ?? '',
    location: e.location ?? '',
    source: 'Calendar',
  }))
}

export function generateBuiltInAiResponse(
  userQuery: string,
  snapshot: WorkSnapshot
): BuiltInAIResponse {
  const q = userQuery.trim().toLowerCase()
  const { emails, events, tasks, jira, teams, deadlines, activities } = snapshot
  const mappedEvents = mapGoogleToCalendarEvents(events)

  // 1. Greetings & Help
  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q.includes('who are you') ||
    q.includes('help') ||
    q.includes('what can you do') ||
    q === 'start'
  ) {
    return {
      answer: `Hello! I am **WorkPilot AI**, your intelligent built-in work assistant.

I analyze all your work data in real time across:
• 📅 **Google Calendar** (${events.length} events)
• 📩 **Gmail** (${emails.length} emails, ${emails.filter((e) => e.isUnread).length} unread)
• 🎯 **Tasks & Priorities** (${tasks.length} total tasks)
• 📊 **Jira Tickets** (${jira.length} active tickets)
• 💬 **Teams Messages** (${teams.length} messages)
• ⏰ **Deadlines** (${deadlines.length} upcoming)

**Here are some things you can ask me:**
- *"What should I focus on right now?"*
- *"Summarize my workday"*
- *"Am I overloaded today?"*
- *"Show me Jira ticket ANZ-342"*
- *"What did Alex say on Teams?"*
- *"Summarize my unread emails"*
- *"What meetings do I have today?"*`,
      type: 'text',
    }
  }

  // 2. Full Workday Briefing / Summary
  if (
    q.includes('brief') ||
    q.includes('summarize') ||
    q.includes('summary') ||
    q.includes('workday') ||
    q.includes('day overview')
  ) {
    const rec = getRecommendedTask(tasks, teams, mappedEvents)
    const workload = calculateWorkload(tasks)
    const unreadEmails = emails.filter((e) => e.isUnread)
    const upcomingEvents = events.slice(0, 3)

    let summaryText = `### 🌅 Workday Briefing\n\n`

    if (rec) {
      summaryText += `**🎯 Top Priority Task:**\n- **${rec.task.id}: ${rec.task.title}** (${rec.task.priority} Priority, Due ${rec.task.deadline})\n  *Reason:* ${rec.reasons.join(' • ')}\n\n`
    }

    summaryText += `**📊 Workload Overview:**\n`
    summaryText += `- ${workload.plannedHoursLabel} planned vs ${workload.availableHoursLabel} available. ${
      workload.isOverloaded ? '⚠️ **You are overloaded today.**' : '✅ **Workload is balanced.**'
    }\n\n`

    summaryText += `**📅 Upcoming Meetings (${events.length}):**\n`
    if (upcomingEvents.length > 0) {
      upcomingEvents.forEach((ev) => {
        const time = formatEventTime(ev.start.dateTime ?? ev.start.date) || 'All day'
        summaryText += `- **${time}**: ${ev.summary}${ev.location ? ` (@ ${ev.location})` : ''}\n`
      })
    } else {
      summaryText += `- No scheduled meetings for today.\n`
    }
    summaryText += `\n`

    summaryText += `**📩 Email Highlights (${unreadEmails.length} Unread):**\n`
    if (emails.length > 0) {
      emails.slice(0, 3).forEach((mail) => {
        summaryText += `- **${mail.from}**: ${mail.subject}${mail.isUnread ? ' *(Unread)*' : ''}\n`
      })
    } else {
      summaryText += `- No connected emails in inbox.\n`
    }

    return {
      answer: summaryText,
      type: 'text',
    }
  }

  // 3. Specific Jira Ticket or General Jira Query
  const ticketMatch = userQuery.match(/\b([A-Z]{2,6}-\d+)\b/i)
  if (ticketMatch) {
    const ticketKey = ticketMatch[1].toUpperCase()
    const ticket = jira.find((j) => j.key.toUpperCase() === ticketKey)
    const relatedTeams = teams.filter(
      (m) =>
        m.message.toUpperCase().includes(ticketKey) ||
        m.linkedTaskId?.toUpperCase() === ticketKey
    )
    const relatedEmails = emails.filter(
      (e) =>
        e.subject.toUpperCase().includes(ticketKey) ||
        (e.bodyText && e.bodyText.toUpperCase().includes(ticketKey))
    )

    if (ticket) {
      let reply = `### 📊 Jira Ticket: ${ticket.key}\n`
      reply += `**Title:** ${ticket.title}\n`
      reply += `**Status:** \`${ticket.status}\` | **Priority:** \`${ticket.priority}\` | **Assignee:** ${ticket.assignee}\n\n`

      if (relatedTeams.length > 0) {
        reply += `**💬 Mentioned in Teams:**\n`
        relatedTeams.forEach((m) => {
          reply += `- **${m.author}** (#${m.channel}): "${m.message}"\n`
        })
        reply += `\n`
      }

      if (relatedEmails.length > 0) {
        reply += `**📩 Related Emails:**\n`
        relatedEmails.forEach((e) => {
          reply += `- **${e.from}**: ${e.subject}\n`
        })
      }

      return { answer: reply, type: 'text' }
    } else {
      return {
        answer: `I looked for ticket **${ticketKey}** in Jira. No active records found.`,
        type: 'text',
      }
    }
  }

  if (q.includes('jira') || q.includes('ticket') || q.includes('sprint') || q.includes('issue')) {
    if (jira.length === 0) {
      return { answer: 'No active Jira tickets found in your workspace.', type: 'text' }
    }
    const lines = jira.map(
      (j) => `- **${j.key}** [${j.status}] — ${j.title} (Assignee: ${j.assignee}, Priority: ${j.priority})`
    )
    return {
      answer: `Here are your Jira tickets:\n\n` + lines.join('\n'),
      type: 'text',
    }
  }

  // 4. Teams & Person Mentions
  if (
    q.includes('teams') ||
    q.includes('chat') ||
    q.includes('slack') ||
    q.includes('mention')
  ) {
    const person = ['alex', 'sarah', 'priya', 'harsh'].find((name) => q.includes(name))
    let filteredMsgs = teams
    if (person) {
      filteredMsgs = teams.filter(
        (m) =>
          m.author.toLowerCase().includes(person) || m.message.toLowerCase().includes(person)
      )
    }

    if (filteredMsgs.length > 0) {
      const items = filteredMsgs.map(
        (m) => `[#${m.channel}] ${m.author}: "${m.message}" (${m.timestamp})`
      )
      return {
        answer: person
          ? `Here are Teams messages related to **${person}**:`
          : `Recent Teams messages and mentions:`,
        type: 'list',
        items,
      }
    } else {
      return { answer: 'No Teams messages or mentions found.', type: 'text' }
    }
  }

  // 5. Prioritization & "What should I do?"
  if (
    q.includes('focus') ||
    q.includes('should i do') ||
    q.includes('priority') ||
    q.includes('what should') ||
    q.includes('urgent') ||
    q.includes('recommend')
  ) {
    const rec = getRecommendedTask(tasks, teams, mappedEvents)
    if (rec) {
      const days = daysUntilDeadline(rec.task.deadline)
      const dueLabel = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`
      return {
        answer: `🎯 **Top Recommendation:** You should focus on **${rec.task.id}: ${rec.task.title}**.

• **Status:** \`${rec.task.status}\` | **Priority:** \`${rec.task.priority}\`
• **Deadline:** ${rec.task.deadline} (${dueLabel})
• **Why it's priority:** ${rec.reasons.join(' ')}

**Other pending tasks:**
` + tasks.filter((t) => t.id !== rec.task.id && t.status !== 'DONE').map((t) => `- **${t.id}**: ${t.title} [${t.priority}]`).join('\n'),
        type: 'text',
      }
    }
    return {
      answer: 'You have no pending tasks! Create a new task in Tasks page to get started.',
      type: 'text',
    }
  }

  // 6. Workload & Overload
  if (
    q.includes('overload') ||
    q.includes('available') ||
    q.includes('hours') ||
    q.includes('workload') ||
    q.includes('busy') ||
    q.includes('postpone') ||
    q.includes('defer')
  ) {
    const workload = calculateWorkload(tasks)
    const recs = getDeferRecommendations(tasks, workload.deficitMinutes)

    if (workload.isOverloaded) {
      let reply = `⚠️ **Workload Alert: You are overloaded today.**\n\n`
      reply += `- **Planned Work:** ${workload.plannedHoursLabel}\n`
      reply += `- **Available Focused Time:** ${workload.availableHoursLabel}\n`
      reply += `- **Deficit:** ${workload.deficitMinutes} minutes\n\n`
      reply += `**Recommended tasks to defer to tomorrow:**\n`
      recs.suggestions.forEach((s) => {
        reply += `- **${s.task.id}: ${s.task.title}** (${s.task.priority} Priority, ${s.minutes} min)\n`
      })
      return { answer: reply, type: 'text' }
    } else {
      return {
        answer: `✅ **Your workload is balanced today.**\n\n- **Planned Work:** ${workload.plannedHoursLabel}\n- **Available Time:** ${workload.availableHoursLabel}`,
        type: 'text',
      }
    }
  }

  // 7. Deadlines & Due Dates
  if (q.includes('deadline') || q.includes('due') || q.includes('coming up') || q.includes('overdue')) {
    if (deadlines.length === 0) {
      return { answer: 'No upcoming deadlines set.', type: 'text' }
    }
    return {
      answer: 'Here are your upcoming deadlines across all sources:',
      type: 'list',
      items: deadlines.map(
        (d) => `📅 **${d.date}**: ${d.title} — \`${d.priority} Priority\` (${d.source})`
      ),
    }
  }

  // 8. Recent Activity / What changed
  if (
    q.includes('changed') ||
    q.includes("what's new") ||
    q.includes('updates') ||
    q.includes('activity') ||
    q.includes('recent')
  ) {
    if (activities.length === 0) {
      return { answer: 'No recent activity recorded yet.', type: 'text' }
    }
    return {
      answer: "Here is what changed recently across your work tools:",
      type: 'activity',
      activities,
    }
  }

  // 9. Calendar & Meetings
  if (q.includes('meeting') || q.includes('calendar') || q.includes('agenda') || q.includes('schedule')) {
    if (events && events.length > 0) {
      return {
        answer: `You have **${events.length} meeting${events.length === 1 ? '' : 's'}** scheduled:`,
        type: 'list',
        items: events.map((event) => {
          const time = formatEventTime(event.start.dateTime ?? event.start.date) || 'All day'
          return `⏰ **${time}**: ${event.summary}${event.location ? ` (@ ${event.location})` : ''}`
        }),
      }
    }
    return {
      answer: 'You have no scheduled meetings in your calendar. Connect Google Calendar to sync your schedule.',
      type: 'text',
    }
  }

  // 10. Email & Inbox (Action Items, Meeting Requests, Unread Summaries)
  if (
    q.includes('email') ||
    q.includes('inbox') ||
    q.includes('gmail') ||
    q.includes('unread') ||
    q.includes('action item') ||
    q.includes('meeting request')
  ) {
    if (emails && emails.length > 0) {
      const insights = extractAllMailInsights(emails)
      const actionItems = insights.flatMap((i) =>
        i.actionItems.map((act) => `📌 **From ${i.from}** (*${i.subject}*): ${act}`)
      )
      const meetingRequests = insights.flatMap((i) =>
        i.meetingRequests.map((meet) => `📅 **From ${i.from}** (*${i.subject}*): ${meet}`)
      )
      const unreadList = emails.filter((e) => e.isUnread)

      if (q.includes('action item') || q.includes('action items')) {
        if (actionItems.length > 0) {
          return {
            answer: `📩 **Extracted Action Items from Email (${actionItems.length} found):**`,
            type: 'list',
            items: actionItems.slice(0, 8),
          }
        }
        return {
          answer: 'No explicit action items found in your recent emails. You are all caught up!',
          type: 'text',
        }
      }

      if (q.includes('meeting request') || q.includes('meeting requests')) {
        if (meetingRequests.length > 0) {
          return {
            answer: `📅 **Meeting Requests & Invites in Inbox (${meetingRequests.length} found):**`,
            type: 'list',
            items: meetingRequests.slice(0, 8),
          }
        }
        return {
          answer: 'No pending meeting requests detected in your recent emails.',
          type: 'text',
        }
      }

      if (q.includes('unread')) {
        return {
          answer: `📬 **Unread Email Summary (${unreadList.length} unread of ${emails.length} total):**`,
          type: 'list',
          items: (unreadList.length > 0 ? unreadList : emails).slice(0, 6).map(
            (e) => `• **${e.from}**: *${e.subject}* — ${e.preview || 'No preview'}`
          ),
        }
      }

      const brief = buildInboxBrief(emails)
      return {
        answer: `📬 **Inbox Overview:** ${emails.length} total messages (${brief.unread} unread, ${actionItems.length} action items, ${meetingRequests.length} meeting requests).\n\nTop Email Highlights:`,
        type: 'list',
        items: brief.bullets,
      }
    }
    return {
      answer: 'No connected emails. Use the Gmail Connector on the Emails page to sync your inbox.',
      type: 'text',
    }
  }

  // 11. Universal Search across ALL Data
  const matches: string[] = []

  // Search Tasks
  tasks.forEach((t) => {
    if (t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)) {
      matches.push(`🎯 **Task ${t.id}**: ${t.title} [${t.status}/${t.priority}] — ${t.description}`)
    }
  })

  // Search Emails
  emails.forEach((e) => {
    if (e.subject.toLowerCase().includes(q) || (e.bodyText && e.bodyText.toLowerCase().includes(q)) || e.from.toLowerCase().includes(q)) {
      matches.push(`📩 **Email from ${e.from}**: "${e.subject}" — ${e.preview || e.bodyText?.slice(0, 100)}`)
    }
  })

  // Search Jira
  jira.forEach((j) => {
    if (j.key.toLowerCase().includes(q) || j.title.toLowerCase().includes(q) || j.assignee.toLowerCase().includes(q)) {
      matches.push(`📊 **Jira ${j.key}**: ${j.title} (${j.status}) — Assignee: ${j.assignee}`)
    }
  })

  // Search Teams
  teams.forEach((m) => {
    if (m.message.toLowerCase().includes(q) || m.author.toLowerCase().includes(q)) {
      matches.push(`💬 **Teams #${m.channel}**: ${m.author}: "${m.message}"`)
    }
  })

  // Search Events
  events.forEach((ev) => {
    if (ev.summary.toLowerCase().includes(q) || (ev.description && ev.description.toLowerCase().includes(q))) {
      matches.push(`📅 **Calendar Event**: ${ev.summary}`)
    }
  })

  if (matches.length > 0) {
    return {
      answer: `Found ${matches.length} matching item${matches.length === 1 ? '' : 's'} across your work data for **"${userQuery}"**:`,
      type: 'list',
      items: matches,
    }
  }

  // 12. Fallback Response
  return {
    answer: `I searched across your Gmail, Calendar, Jira, Teams messages, and Tasks, but couldn't find an exact match for **"${userQuery}"**.

**Try asking about:**
- *"What should I focus on today?"*
- *"Summarize my workday"*
- *"Show me my upcoming meetings"*
- *"Am I overloaded today?"*
- *"What are my unread emails?"*
- *"Show active Jira tickets"*`,
    type: 'text',
  }
}
