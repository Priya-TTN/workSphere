import type { Activity } from '@/types'
import type { CalendarEvent } from '@/types'
import type { GoogleCalendarEvent } from '@/services/googleCalendar'
import type { WorkSnapshot } from '@/services/ai/contextEngine'
import { getRecommendedTask, WORKDAY_DATE } from '@/services/taskRecommendation'
import { extractAllMailInsights } from '@/services/email/emailExtractor'
import { formatEventTime } from '@/services/googleCalendar'

export interface ChatAction {
  label: string
  action: string
  payload?: Record<string, any>
}

export interface BuiltInAIResponse {
  answer: string
  type?: 'text' | 'list' | 'activity'
  actionType?: 'pdf' | 'convert_email_tasks' | 'clear_completed'
  items?: string[]
  activities?: Activity[]
  confidence?: 'High' | 'Medium' | 'Low'
  reasons?: string[]
  sources?: string[]
  suggestedActions?: ChatAction[]
  activeTopic?: string
  agenticEffect?: {
    type: 'create_task' | 'update_task' | 'complete_task' | 'delete_task'
    taskData?: any
  }
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
  snapshot: WorkSnapshot,
  activeTopic?: string
): BuiltInAIResponse {
  const q = userQuery.trim().toLowerCase()
  const { emails, events, tasks, jira, teams } = snapshot
  const mappedEvents = mapGoogleToCalendarEvents(events)

  // 39. Permission-Aware & Security Check
  if (
    q.includes('private email') ||
    q.includes('password') ||
    q.includes('salary') ||
    q.includes("rahul's private") ||
    q.includes("alex's private")
  ) {
    return {
      answer: '🔒 **Security & Governance Policy:** I can only access work items, tasks, and communications that your account is explicitly authorized to view in this workspace.',
      type: 'text',
      confidence: 'High',
      sources: ['Enterprise Access Policy'],
    }
  }

  // 43. Multilingual Support (Hindi / Spanish detection)
  if (q.includes('mujhe aaj') || q.includes('kya kaam') || q.includes('aaj kya')) {
    const rec = getRecommendedTask(tasks, teams, mappedEvents)
    const taskTitle = rec ? rec.task.title : 'ANZ-342 API Integration'
    return {
      answer: `🤖 **WorkPilot AI (Hindi Assistant):**

Aaj aapka sabse important task **${taskTitle}** hai.
- **Priority:** High 🔴
- **Deadline:** Today / Tomorrow
- **Reason:** Client impact aur production deadline pending hai.

Aap niche diye gaye button par click karke task start kar sakte hain!`,
      type: 'text',
      confidence: 'High',
      sources: ['Jira', 'Calendar', 'Tasks'],
      suggestedActions: [
        { label: '⚡ Start Task Now', action: 'start_task' },
        { label: '📄 Workday PDF Export', action: 'pdf' },
      ],
    }
  }

  // 12. Agentic Task Management Commands (Create, Complete, Update, Delete)
  if (q.startsWith('create task') || q.startsWith('add task') || q.includes('create a task')) {
    const titleMatch = userQuery.replace(/^(create|add)\s+(a\s+)?task\s+(to\s+)?/i, '').trim()
    const taskTitle = titleMatch || 'New Chat Task'
    return {
      answer: `✅ **Created Task:** "${taskTitle}"

- **Priority:** HIGH 🔴
- **Status:** TODO
- **Source:** Created via WorkPilot Chatbot`,
      type: 'text',
      confidence: 'High',
      sources: ['WorkPilot Task Engine'],
      agenticEffect: {
        type: 'create_task',
        taskData: {
          title: taskTitle,
          priority: 'HIGH',
          deadline: WORKDAY_DATE,
        },
      },
      suggestedActions: [{ label: '🎯 View Tasks Page', action: 'view_tasks' }],
    }
  }

  if (q.includes('mark') && (q.includes('completed') || q.includes('done'))) {
    const target = tasks.find((t) => q.includes(t.id.toLowerCase()) || q.includes(t.title.toLowerCase())) || tasks[0]
    return {
      answer: `✅ **Task Completed:** **${target ? target.title : 'Task'}** has been marked as DONE in your workspace pipeline!`,
      type: 'text',
      confidence: 'High',
      sources: ['Tasks Pipeline'],
      agenticEffect: {
        type: 'complete_task',
        taskData: { id: target ? target.id : 'T-101' },
      },
    }
  }

  if (q.includes('change deadline') || q.includes('update deadline') || q.includes('reschedule task')) {
    const target = tasks[0]
    return {
      answer: `🗓️ **Task Schedule Updated:** Updated deadline for **${target ? target.title : 'Task'}** to Friday.`,
      type: 'text',
      confidence: 'High',
      sources: ['Tasks Engine'],
      agenticEffect: {
        type: 'update_task',
        taskData: { id: target ? target.id : 'T-101', deadline: 'Friday' },
      },
    }
  }

  if (q.includes('delete task') || q.includes('remove task')) {
    return {
      answer: '🗑️ **Task Deleted:** Removed target documentation task from your task pipeline.',
      type: 'text',
      confidence: 'High',
      sources: ['Tasks Engine'],
      agenticEffect: {
        type: 'delete_task',
        taskData: { title: 'documentation' },
      },
    }
  }

  // 11. "What should I do now?" / 10. Smart Priority Explanation & Follow-ups ("Why?")
  if (
    q === 'why?' ||
    q === 'why' ||
    q.includes('why should i') ||
    q.includes('explain priority') ||
    q.includes('why is it high')
  ) {
    const topic = activeTopic || 'ANZ-342'
    return {
      answer: `🔥 **Smart Priority Explanation for ${topic}:**

- **Priority Level:** 🔴 **HIGH**
- **Reason Breakdown:**
  ✓ **Production Impact:** Core payment API module directly affects active end users.
  ✓ **Deadline:** Due tomorrow (${WORKDAY_DATE}) with zero slack time.
  ✓ **Client Affected:** Enterprise Client ABC requested status update.
  ✓ **Related Schedule:** Calendar meeting scheduled today at 11:30 AM.
  ✓ **Dependencies:** 2 sub-tasks waiting on this release.`,
      type: 'text',
      confidence: 'High',
      reasons: [
        'Production critical path',
        'Due tomorrow',
        'Client meeting today at 11:30 AM',
        'Blocks 2 team deliverables',
      ],
      sources: [`Jira ${topic}`, 'Gmail', 'Calendar', 'Teams'],
      suggestedActions: [
        { label: '⚡ Start Task Now', action: 'start_task' },
        { label: '🗓️ Schedule Slot', action: 'schedule_task' },
        { label: '🎫 View Jira Ticket', action: 'view_jira' },
      ],
      activeTopic: topic,
    }
  }

  if (
    q.includes('what should i do now') ||
    q.includes('what should i do first') ||
    q.includes('what should i work on') ||
    q.includes('what to do next') ||
    q.includes('next action')
  ) {
    const rec = getRecommendedTask(tasks, teams, mappedEvents)
    const recTask = rec ? rec.task : tasks[0]
    const targetTitle = recTask ? `${recTask.id}: ${recTask.title}` : 'ANZ-342: Production Payment API Fix'

    return {
      answer: `🎯 **WorkPilot AI Recommendation:**

You currently have **3.5 hours of available focus time** before your next meeting.

I strongly recommend working on **${targetTitle}** first.

• **Estimated Effort:** 45 minutes
• **Priority:** 🔴 HIGH
• **Reason:** Production impact + due tomorrow + client meeting today at 11:30 AM.`,
      type: 'text',
      confidence: 'High',
      reasons: [
        'High priority rating',
        'Client impact',
        'Due tomorrow',
        'Related meeting at 11:30 AM',
      ],
      sources: ['Jira ANZ-342', 'Google Calendar', 'Gmail', 'Teams'],
      suggestedActions: [
        { label: '⚡ Start Task', action: 'start_task' },
        { label: '🗓️ Schedule (10:00 AM)', action: 'schedule_task' },
        { label: '🎫 View Jira', action: 'view_jira' },
      ],
      activeTopic: recTask ? recTask.id : 'ANZ-342',
    }
  }

  // 13. AI Scheduling Through Chat
  if (q.includes('schedule') && (q.includes('jira') || q.includes('task') || q.includes('anz') || q.includes('testing'))) {
    return {
      answer: `🗓️ **Smart Calendar Slot Detected:**

I found a 1-hour open focus slot in your Google Calendar:
- **Slot:** Tomorrow 10:00 AM – 11:00 AM (No meeting conflicts)
- **Target Task:** ANZ-342 (Jira Testing & Review)

Would you like me to reserve this focus block on your calendar?`,
      type: 'text',
      confidence: 'High',
      sources: ['Google Calendar API'],
      suggestedActions: [
        { label: '✅ Yes, Schedule Slot', action: 'confirm_schedule' },
        { label: '❌ Find Another Time', action: 'reschedule' },
      ],
    }
  }

  // 15. Blocker Chat & 16. What Am I Waiting For & 17. Who Is Waiting For Me
  if (q.includes('blocking') || q.includes('blocker') || q.includes('what is blocking')) {
    return {
      answer: `🚧 **Active Work Blockers & Dependencies Identified (2 items):**`,
      type: 'list',
      items: [
        '⚠️ **Blocker 1:** Waiting for Rahul\'s test results (*Source: Teams channel #dev-sync*)',
        '⚠️ **Blocker 2:** Waiting for Client ABC proposal approval (*Source: Gmail Inbox*)',
      ],
      confidence: 'High',
      sources: ['Teams #dev-sync', 'Gmail Inbox'],
      suggestedActions: [
        { label: '📩 Send Follow-up Email', action: 'draft_followup' },
        { label: '💬 Message Rahul on Teams', action: 'draft_teams_reply' },
      ],
    }
  }

  if (q.includes('waiting for me') || q.includes('who is waiting')) {
    return {
      answer: `👥 **People Waiting For Your Action (3 people):**`,
      type: 'list',
      items: [
        '1. **Rahul** → Waiting for testing review feedback (*Teams message*)',
        '2. **Priya** → Waiting for client presentation document (*Gmail email*)',
        '3. **Amit** → Waiting for code review on Jira ticket ANZ-342 (*Jira*)',
      ],
      confidence: 'High',
      sources: ['Teams', 'Gmail', 'Jira'],
      suggestedActions: [
        { label: '📝 Reply to Rahul', action: 'draft_teams_reply' },
        { label: '📩 Reply to Priya', action: 'draft_email_reply' },
      ],
    }
  }

  if (q.includes('what am i waiting for') || q.includes('waiting for')) {
    return {
      answer: `⏳ **Items You Are Waiting For (3 pending dependencies):**`,
      type: 'list',
      items: [
        '1. 📩 **Client Approval** — Re: *Enterprise SOW proposal* (Sent 2 days ago)',
        '2. 💬 **Rahul\'s Test Results** — Re: *Payment API staging build*',
        '3. 📊 **Manager Feedback** — Re: *Q3 Architecture roadmap*',
      ],
      confidence: 'High',
      sources: ['Gmail', 'Teams', 'Jira'],
      suggestedActions: [
        { label: '📩 Send Follow-Up Email', action: 'draft_followup' },
      ],
    }
  }

  // 18. Duplicate Detection Through Chat
  if (q.includes('duplicate') || q.includes('duplicate tasks')) {
    return {
      answer: `🔄 **Duplicate Task Detected Across Work Sources:**

- **Item 1 (Gmail):** *"Update executive dashboard"*
- **Item 2 (Jira):** *"ANZ-231 — Dashboard update & metric widgets"*

**Recommendation:** These appear to refer to the same deliverable. Merge them to prevent double tracking.`,
      type: 'text',
      confidence: 'High',
      sources: ['Gmail', 'Jira API'],
      suggestedActions: [
        { label: '🔗 Merge Tasks', action: 'merge_tasks' },
        { label: 'Keep Separate', action: 'keep_separate' },
      ],
    }
  }

  // 19. Cross-Source Questions & 20. Universal Search ("Everything about Project Phoenix" or "ANZ-342")
  if (q.includes('everything about') || q.includes('project phoenix') || q.includes('phoenix') || q.includes('anz-342')) {
    const topic = q.includes('phoenix') ? 'Project Phoenix' : 'ANZ-342'
    return {
      answer: `🔗 **360° Cross-Source Workspace Summary for "${topic}":**

- 🎫 **Jira Tickets (12):** ANZ-342 Production Payment Issue & 11 sub-tickets
- 📧 **Emails (17):** 3 urgent emails from Client ABC
- 💬 **Teams Messages (31):** 7 active mentions in #project-phoenix
- 📅 **Calendar Meetings (5):** Client Sync scheduled tomorrow at 11:30 AM
- 📄 **Documents (8):** Project Architecture & Security Audit Docs
- 📊 **Excel Files (3):** \`Project_Status.xlsx\` (Needs review)`,
      type: 'text',
      confidence: 'High',
      sources: ['Jira', 'Gmail', 'Teams', 'Calendar', 'Documents', 'Excel'],
      suggestedActions: [
        { label: '📄 Export PDF Summary', action: 'pdf' },
        { label: '📊 View Jira Tickets', action: 'view_jira' },
      ],
      activeTopic: topic,
    }
  }

  // 21. Project Intelligence Chat & 22. Project Health
  if (q.includes('project health') || q.includes('status of project') || q.includes('at risk') || q.includes('project status')) {
    return {
      answer: `🧠 **Project Intelligence Status: Project Phoenix**

**Overall Health:** 🟡 **AT RISK**

- 🎫 **Jira Tickets:** 12 open tickets (3 high priority)
- ⏱️ **Milestones:** 2 milestones delayed by 2 days
- 🚧 **Blockers:** 1 critical blocker (Waiting for client approval)
- ⏰ **Deadlines:** 3 upcoming deadlines this week

**Why is it at risk?**
The payment API migration ticket ANZ-342 is blocked by pending client approval, delaying the staging deployment scheduled for Friday.`,
      type: 'text',
      confidence: 'High',
      reasons: [
        '2 milestones delayed',
        '1 critical blocker pending client approval',
        '3 upcoming tight deadlines',
      ],
      sources: ['Jira API', 'Teams #project-phoenix', 'Gmail'],
      suggestedActions: [
        { label: '📩 Send Follow-Up to Client', action: 'draft_followup' },
        { label: '📄 Workday PDF Export', action: 'pdf' },
      ],
      activeTopic: 'Project Phoenix',
    }
  }

  // 23. Follow-Up Assistant & 34. Unanswered Questions
  if (q.includes('follow up') || q.includes('who should i follow up with') || q.includes('unanswered questions')) {
    return {
      answer: `📬 **Conversations & Questions Requiring Follow-Up:**`,
      type: 'list',
      items: [
        '1. **Rahul** (Teams): Asked *"Can you confirm the deployment date for Friday?"*',
        '2. **Client ABC** (Gmail): Asked *"Can you provide the updated security audit report?"*',
        '3. **John** (Gmail): No response received to your SOW draft sent 3 days ago.',
      ],
      confidence: 'High',
      sources: ['Gmail Inbox', 'Teams Messages'],
      suggestedActions: [
        { label: '📝 Draft Follow-up for Rahul', action: 'draft_teams_reply' },
        { label: '📩 Draft Reply for Client ABC', action: 'draft_email_reply' },
      ],
    }
  }

  // 24. Email Drafting & 25. Teams Reply Drafting
  if (q.includes('draft reply') || q.includes('draft email') || q.includes('reply to rahul') || q.includes('make email professional')) {
    const isTeams = q.includes('rahul') || q.includes('teams')
    const draftText = isTeams
      ? `Hi Rahul, I have reviewed the testing document and everything looks good for Friday's deployment. Let's proceed as planned!`
      : `Hi Team,\n\nThank you for your update. I have reviewed the deliverables and confirmed our schedule for the upcoming release.\n\nBest regards,\nHarsh Vardhan`

    return {
      answer: `📝 **AI Generated ${isTeams ? 'Teams Reply' : 'Email Draft'}:**

> *"${draftText}"*`,
      type: 'text',
      confidence: 'High',
      sources: [isTeams ? 'Teams Draft Assistant' : 'Email Composer'],
      suggestedActions: [
        { label: '📋 Copy to Clipboard', action: 'copy_text', payload: { text: draftText } },
        { label: '✨ Make More Professional', action: 'refine_professional' },
        { label: '⚡ Make Concise', action: 'refine_concise' },
      ],
    }
  }

  // 28. Morning Briefing & 29. End-of-Day Chat & 30. Catch Me Up & 31. What Changed
  if (q.includes('morning briefing') || q.includes('good morning') || q.includes('catch me up') || q.includes('what changed')) {
    return {
      answer: `🌅 **GOOD MORNING 👋 WorkPilot Briefing**

**Updates Since Yesterday:**
• 📩 **5 Important Emails** (1 requiring immediate reply)
• 💬 **3 Teams Mentions** in #dev-sync
• 🎫 **2 Jira Updates** (ANZ-342 updated to 🔴 High Priority)
• 📅 **4 Meetings Scheduled** today

**🔥 Top 3 Priorities:**
1. **ANZ-342:** Production Payment API Fix (High)
2. **Client Proposal Review:** Due 5:00 PM
3. **Sprint Testing:** 2:00 PM focus block

**⚠️ Workload Status:** Balanced (4.5 hrs planned vs 6 hrs focus time available)`,
      type: 'text',
      confidence: 'High',
      sources: ['Gmail', 'Calendar', 'Jira', 'Teams'],
      suggestedActions: [
        { label: '⚡ Start Top Priority Task', action: 'start_task' },
        { label: '📄 Export PDF Briefing', action: 'pdf' },
      ],
    }
  }

  if (q.includes('end of day') || q.includes('eod summary') || q.includes('eod report')) {
    const completedCount = tasks.filter((t) => t.status === 'DONE').length + 4
    return {
      answer: `🌙 **End-of-Day Work Summary**

• ✅ **Completed Today:** ${completedCount} tasks delivered on schedule
• 📌 **Remaining Pending:** ${tasks.filter((t) => t.status !== 'DONE').length} tasks carried to tomorrow
• 🚧 **Active Blockers:** 1 task waiting on client approval
• 🌟 **Tomorrow's Focus:** Client Proposal Review & Deployment checklist`,
      type: 'text',
      confidence: 'High',
      sources: ['Tasks Pipeline', 'Workday Tracker'],
      suggestedActions: [{ label: '📄 Download EOD PDF Report', action: 'pdf' }],
    }
  }

  // 7. Excel Chat & 8. Document Chat & 9. Meeting Chat & 32. Decisions & 33. Commitments
  if (q.includes('excel') || q.includes('project_status.xlsx') || q.includes('which project is delayed')) {
    return {
      answer: `📊 **Excel Analysis for \`Project_Status.xlsx\`:**

- ⚠️ **Most Delayed Project:** Project Phoenix (2 milestones delayed by 2 days)
- 🔴 **Projects at Risk:** 1 out of 4 active projects
- ⚡ **Highest Workload Team:** Core API Engineering Team (92% capacity)
- 📈 **Key Metric:** On-time milestone completion rate is 88%.`,
      type: 'text',
      confidence: 'High',
      sources: ['Project_Status.xlsx'],
      suggestedActions: [{ label: '📄 Download PDF Report', action: 'pdf' }],
    }
  }

  if (q.includes('document') || q.includes('pdf') || q.includes('responsibilities') || q.includes('what did we decide')) {
    if (q.includes('decide') || q.includes('decision')) {
      return {
        answer: `🧠 **Decision Recorded:** The engineering team decided to move deployment to **Friday at 4:00 PM** to allow thorough QA testing.\n\n*Source: Deployment Planning Meeting Minutes*`,
        type: 'text',
        confidence: 'High',
        sources: ['Deployment Planning Meeting Minutes'],
      }
    }
    if (q.includes('promise') || q.includes('commitment')) {
      return {
        answer: `📌 **Your Active Commitments (3 items):**`,
        type: 'list',
        items: [
          '1. Send client audit report — *Thursday by 5:00 PM*',
          '2. Review testing document for Rahul — *Friday morning*',
          '3. Prepare deployment checklist — *Friday 2:00 PM*',
        ],
        confidence: 'High',
        sources: ['Teams Chat History', 'Gmail Sent Items'],
      }
    }
  }

  // A. PDF Report Generation Command
  if (
    q.includes('pdf') ||
    q.includes('generate pdf') ||
    q.includes('print report') ||
    q.includes('download report') ||
    q.includes('todays work pdf') ||
    q.includes('download workday pdf')
  ) {
    const pendingTasks = tasks.filter((t) => t.status !== 'DONE')
    const unreadEmails = emails.filter((e) => e.isUnread)
    return {
      answer: `📄 **Generating Today's Executive Workday PDF Report...**

Below is your workday summary compiled for export:`,
      type: 'list',
      items: [
        `🎯 **${tasks.length} Total Tasks** (${pendingTasks.length} pending focus items)`,
        `📅 **${events.length} Calendar Meetings** scheduled today`,
        `📩 **${emails.length} Connected Emails** (${unreadEmails.length} unread action items)`,
        `📊 **${jira.length} Active Jira Sprint Tickets** tracked`,
      ],
      actionType: 'pdf',
      confidence: 'High',
      sources: ['WorkPilot Report Generator'],
      suggestedActions: [{ label: '📄 Print / Download PDF Now', action: 'pdf' }],
    }
  }

  // A2. Complete Tasks, Meetings & Emails List Digest
  if (
    q.includes('list today') ||
    q.includes('list tasks') ||
    q.includes('tasks, meetings') ||
    q.includes('tasks meeting mails') ||
    q.includes('task meeting mails') ||
    q.includes('list digest')
  ) {
    const listItems: string[] = []

    events.forEach((ev) => {
      const time = formatEventTime(ev.start.dateTime ?? ev.start.date) || 'Today'
      listItems.push(`📅 **[Meeting ${time}]** ${ev.summary}${ev.location ? ` (@ ${ev.location})` : ''}`)
    })

    tasks.slice(0, 5).forEach((t) => {
      listItems.push(`🎯 **[Task ${t.priority.toUpperCase()}]** ${t.title} (${t.status.replace('_', ' ')})`)
    })

    emails.slice(0, 4).forEach((m) => {
      listItems.push(`📩 **[Email]** From ${m.from}: "${m.subject}"${m.isUnread ? ' *(Unread)*' : ''}`)
    })

    jira.slice(0, 3).forEach((j) => {
      listItems.push(`📊 **[Jira ${j.key}]** ${j.title} (\`${j.status}\`)`)
    })

    return {
      answer: `📋 **Today's Complete Workday List Digest (${listItems.length} items):**`,
      type: 'list',
      items: listItems,
      confidence: 'High',
      sources: ['Calendar', 'Tasks', 'Gmail', 'Jira'],
      suggestedActions: [
        { label: '📄 Export PDF Digest', action: 'pdf' },
        { label: '📌 Convert Mails to Tasks', action: 'convert_email_tasks' },
      ],
    }
  }

  // A3. High Priority Email Action Items List
  if (
    q.includes('high priority email') ||
    q.includes('email action items list') ||
    q.includes('action items list')
  ) {
    const insights = extractAllMailInsights(emails)
    const actionItems = insights.flatMap((i) =>
      i.actionItems.map((act) => `📌 **From ${i.from}**: ${act} (*${i.subject}*)`)
    )

    if (actionItems.length > 0) {
      return {
        answer: `📩 **High-Priority Email Action Items List (${actionItems.length} items extracted):**`,
        type: 'list',
        items: actionItems,
        confidence: 'High',
        sources: ['Gmail Action Extractor'],
        suggestedActions: [{ label: '📌 Convert All to Tasks', action: 'convert_email_tasks' }],
      }
    }
    return {
      answer: `📩 **No pending high-priority email action items found in connected inbox.**`,
      type: 'text',
    }
  }

  // A4. Daily Team Standup Report
  if (
    q.includes('standup') ||
    q.includes('daily standup') ||
    q.includes('team standup report') ||
    q.includes('generate standup')
  ) {
    const doneTasks = tasks.filter((t) => t.status === 'DONE')
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'TODO')
    const blockerJira = jira.filter((j) => j.priority === 'HIGH')

    return {
      answer: `🚀 **Daily Team Standup Report**

**1. Accomplished Yesterday:**
${doneTasks.length > 0 ? doneTasks.map((t) => `• ✅ Completed task: ${t.title}`).join('\n') : '• Delivered ongoing sprint code reviews and task planning'}

**2. Planned Today:**
${inProgressTasks.slice(0, 3).map((t) => `• ⚡ Focus on ${t.id}: ${t.title}`).join('\n')}
• 📅 Attend scheduled team syncs (${events.length} meeting${events.length === 1 ? '' : 's'})

**3. Blockers / Dependencies:**
${blockerJira.length > 0 ? blockerJira.map((j) => `• ⚠️ Jira ${j.key}: ${j.title} (${j.priority} priority)`).join('\n') : '• No active blockers standard delivery on track.'}`,
      type: 'text',
      confidence: 'High',
      sources: ['Jira', 'Tasks', 'Calendar'],
      suggestedActions: [{ label: '📄 Export PDF Standup', action: 'pdf' }],
    }
  }

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
      answer: `Hello! I am **WorkPilot AI**, your intelligent work assistant.

I analyze all your work data in real time across:
• 📅 **Google Calendar** (${events.length} events)
• 📩 **Gmail** (${emails.length} emails, ${emails.filter((e) => e.isUnread).length} unread)
• 🎯 **Tasks & Priorities** (${tasks.length} total tasks)
• 📊 **Jira Tickets** (${jira.length} active tickets)
• 💬 **Teams Messages** (${teams.length} messages)

**Try asking me:**
- *"What should I do now?"*
- *"What is blocking my work?"*
- *"Who is waiting for me?"*
- *"Show me everything about ANZ-342"*
- *"List today's tasks, meetings & mails"*
- *"Generate daily team standup report"*`,
      type: 'text',
      confidence: 'High',
      sources: ['WorkPilot AI Engine'],
      suggestedActions: [
        { label: '⚡ What should I do now?', action: 'what_next' },
        { label: '📄 Workday PDF Export', action: 'pdf' },
        { label: '📅 List Tasks & Meetings', action: 'list_digest' },
      ],
    }
  }

  // 3. Jira Queries
  const ticketMatch = userQuery.match(/\b([A-Z]{2,6}-\d+)\b/i)
  if (ticketMatch) {
    const ticketKey = ticketMatch[1].toUpperCase()
    const ticket = jira.find((j) => j.key.toUpperCase() === ticketKey)
    if (ticket) {
      return {
        answer: `### 📊 Jira Ticket: ${ticket.key}
**Title:** ${ticket.title}
**Status:** \`${ticket.status}\` | **Priority:** \`${ticket.priority}\` | **Assignee:** ${ticket.assignee}`,
        type: 'text',
        confidence: 'High',
        sources: [`Jira ${ticketKey}`],
        suggestedActions: [
          { label: '⚡ Start Task', action: 'start_task' },
          { label: '🗓️ Schedule Slot', action: 'schedule_task' },
        ],
        activeTopic: ticketKey,
      }
    }
  }

  // 4. Teams & Person Mentions
  if (q.includes('teams') || q.includes('chat') || q.includes('mention') || q.includes('rahul')) {
    return {
      answer: `💬 **Teams Activity & Mentions:**
- **Rahul** (#dev-sync): *"Please review the payment API testing doc before tomorrow."*
- **Priya** (#general): *"Client presentation draft is ready for review."*`,
      type: 'text',
      confidence: 'High',
      sources: ['Teams Messages'],
      suggestedActions: [{ label: '📝 Reply to Rahul', action: 'draft_teams_reply' }],
      activeTopic: 'Rahul',
    }
  }

  // Fallback Response with Evidence & Action
  return {
    answer: `I searched across your Gmail, Calendar, Jira, Teams messages, and Tasks for **"${userQuery}"**.

**Try these showcase commands:**
- *"What should I do now?"*
- *"What is blocking my work?"*
- *"Who is waiting for me?"*
- *"Show everything about ANZ-342"*
- *"Generate today's work PDF report"*`,
    type: 'text',
    confidence: 'Medium',
    sources: ['WorkPilot Universal Search'],
    suggestedActions: [
      { label: '⚡ What should I do now?', action: 'what_next' },
      { label: '📄 Generate PDF Report', action: 'pdf' },
    ],
  }
}
