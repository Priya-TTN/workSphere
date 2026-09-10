import type { WorkSnapshot } from '@/services/ai/contextEngine'
import { extractAllMailInsights } from '@/services/email/emailExtractor'
import { formatEventTime } from '@/services/googleCalendar'

export function generateWorkdayPdf(snapshot: WorkSnapshot): void {
  const { now, emails, events, tasks } = snapshot
  const formattedDate = new Date(now).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const insights = extractAllMailInsights(emails)
  const mailActions = insights.flatMap((i) =>
    i.actionItems.map((act) => ({ from: i.from, subject: i.subject, action: act }))
  )

  const todoTasks = tasks.filter((t) => t.status !== 'DONE')
  const doneTasks = tasks.filter((t) => t.status === 'DONE')

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>WorkPilot AI - Workday Report (${formattedDate})</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            background: #ffffff;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-b: 2px solid #7c3aed;
            padding-bottom: 12px;
            margin-bottom: 24px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
          .brand-sub {
            font-size: 12px;
            color: #64748b;
            margin: 2px 0 0 0;
          }
          .report-badge {
            background: #f3e8ff;
            color: #7c3aed;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .metric-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            background: #f8fafc;
          }
          .metric-label {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
          }
          .metric-value {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 4px;
          }
          .section {
            margin-bottom: 24px;
          }
          .section-title {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            text-align: left;
            padding: 8px 10px;
            border-bottom: 1px solid #f1f5f9;
          }
          th {
            background: #f8fafc;
            color: #475569;
            font-weight: 600;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
          }
          .badge-high { background: #fee2e2; color: #dc2626; }
          .badge-medium { background: #fef3c7; color: #d97706; }
          .badge-low { background: #dcfce7; color: #16a34a; }
          .empty {
            font-size: 12px;
            color: #94a3b8;
            font-style: italic;
            padding: 8px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <div>
              <h1 class="brand-title">WorkPilot AI</h1>
              <p class="brand-sub">Workday Summary & Progress Report — ${formattedDate}</p>
            </div>
          </div>
          <span class="report-badge">Executive Briefing</span>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Active Tasks</div>
            <div class="metric-value">${todoTasks.length}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Completed Tasks</div>
            <div class="metric-value">${doneTasks.length}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Scheduled Meetings</div>
            <div class="metric-value">${events.length}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Email Action Items</div>
            <div class="metric-value">${mailActions.length}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            <span>🎯 Tasks & Action Items</span>
            <span style="font-size:11px; color:#64748b; font-weight:normal;">${tasks.length} total recorded</span>
          </div>
          ${
            tasks.length === 0
              ? '<p class="empty">No tasks currently recorded in workspace.</p>'
              : `
            <table>
              <thead>
                <tr>
                  <th style="width: 15%;">ID</th>
                  <th style="width: 45%;">Title</th>
                  <th style="width: 15%;">Priority</th>
                  <th style="width: 15%;">Deadline</th>
                  <th style="width: 10%;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${tasks
                  .map(
                    (t) => `
                  <tr>
                    <td><strong>${t.id}</strong></td>
                    <td>${t.title}</td>
                    <td><span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span></td>
                    <td>${t.deadline || 'Today'}</td>
                    <td>${t.status}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
          }
        </div>

        <div class="section">
          <div class="section-title">
            <span>📅 Calendar Meetings (${events.length})</span>
          </div>
          ${
            events.length === 0
              ? '<p class="empty">No meetings scheduled for today.</p>'
              : `
            <table>
              <thead>
                <tr>
                  <th style="width: 25%;">Time</th>
                  <th style="width: 50%;">Meeting Summary</th>
                  <th style="width: 25%;">Location</th>
                </tr>
              </thead>
              <tbody>
                ${events
                  .map(
                    (e) => `
                  <tr>
                    <td>${formatEventTime(e.start.dateTime ?? e.start.date) || 'All Day'}</td>
                    <td><strong>${e.summary}</strong></td>
                    <td>${e.location || 'Online'}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
          }
        </div>

        <div class="section">
          <div class="section-title">
            <span>📩 Extracted Email Insights & Action Items (${mailActions.length})</span>
          </div>
          ${
            mailActions.length === 0
              ? '<p class="empty">No active action items extracted from connected email.</p>'
              : `
            <table>
              <thead>
                <tr>
                  <th style="width: 25%;">Sender</th>
                  <th style="width: 35%;">Subject</th>
                  <th style="width: 40%;">Extracted Deliverable / Action</th>
                </tr>
              </thead>
              <tbody>
                ${mailActions
                  .slice(0, 10)
                  .map(
                    (a) => `
                  <tr>
                    <td><strong>${a.from}</strong></td>
                    <td>${a.subject}</td>
                    <td>${a.action}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
          }
        </div>

        <div class="footer">
          <span>Generated automatically by WorkPilot AI</span>
          <span>${new Date().toISOString()}</span>
        </div>
      </body>
    </html>
  `

  const printWindow = window.open('', '_blank', 'width=900,height=800')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 400)
  }
}
