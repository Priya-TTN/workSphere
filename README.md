# 🚀 WorkPilot AI — Intelligent Enterprise Work Assistant

> **Turn fragmented work into your smartest next action.**

WorkPilot AI brings your tasks, emails, calendar meetings, Teams messages, Jira work, documents, and Excel spreadsheets into one unified, intelligent productivity workspace.

---

## 🌟 Key Features & Modules

### 🤖 1. Context-Aware AI Chatbot (50 Capabilities)
- **Natural-Language Work Reasoning:** Reason over real-time workspace data from Gmail, Google Calendar, Tasks, Jira tickets, and Teams chats.
- **Agentic Actions:** Execute task creation, task completion, schedule updates, PDF reports, and email reply drafting directly from chat prompts.
- **Evidence & Priority Reasoning:** Displays clear priority scoring (e.g. `96/100 — Critical`), evidence checklists (`✓ Due today`, `✓ Production impact`), **Confidence Scores** (`Confidence: High`), and **Source Citations** (`Sources: 🎫 Jira ANZ-342 • 📩 Gmail • 📅 Calendar`).
- **Interactive Action Buttons:** Direct action triggers (`⚡ Start Task`, `🗓️ Schedule Slot`, `🎫 View Jira`, `📄 Export PDF`).
- **Multi-Turn Memory:** Retains topic context (e.g. `ANZ-342` or `Project Phoenix`) for follow-up questions like *"Why?"*, *"Why is it at risk?"*, or *"Draft a reply"*.

### 📅 2. Google Calendar Integration & Smart Meeting Sync
- **Live Sync & iCal Feed Support:** Fast parallel racing between Google OAuth 2.0 API, direct Proxy iCal parsing, and 60-day upcoming event fallback chain.
- **Instant Caching:** `localStorage` persistence for zero layout shifts and instant calendar load speeds.
- **Meeting Conflict & Free Time Detection:** Calculates available focus hours vs. planned meeting time.

### 📩 3. Gmail Connector & Action Item Extraction
- **Gmail IMAP Node Dev Server Proxy:** Built-in dev server proxy (`vite/gmailImapPlugin.ts`) with socket error handling and auto-reconnect.
- **Action Item & Meeting Request Extractor:** Automatically parses email threads to extract pending action items, meeting invites, and deadlines.

### 📄 4. Executive Workday PDF Generator
- **One-Click Workday Export:** Generates structured executive workday PDF reports containing task metrics, calendar agenda, email highlights, and Jira sprint status using custom `@media print` styling.

### 🎯 5. Smart Workload & Priority Engine
- **Workload Deficit Calculation:** Calculates planned task hours vs. available focus time and suggests optimal tasks to defer to tomorrow.
- **Task Recommendation:** Automated scoring matrix recommending top priority focus tasks based on deadlines, source impact, and meeting schedules.

### 📊 6. Jira & Teams Integrations
- **Sprint & Ticket Tracking:** Track active Jira tickets (`ANZ-342`), status, priority, and assignees.
- **Teams Mention Alerts:** Detects person mentions, channel messages, and pending questions from teammates.

### ⚡ 7. Performance & UX Architecture
- **Code Splitting & Skeleton Loaders:** `React.lazy()` route splitting combined with shimmer `Suspense` loaders (`DashboardSkeleton.tsx`, `PageSkeleton.tsx`, `Skeleton.tsx`) for instant visual feedback.
- **Dark Mode Support:** Smooth dark/light theme switching with persistent user preferences.

---

## ⚡ Popular AI Chatbot Commands

| Command | Capability |
| :--- | :--- |
| `⚡ What should I work on first today?` | Top priority breakdown with 96/100 score, evidence list, and effort estimate |
| `📅 Plan my day around my meetings.` | AI workday schedule breakdown with focus blocks & overload warnings |
| `📩 Which emails need my attention?` | Extracted email action items categorized by urgency |
| `📄 Generate today's work PDF report` | Instant browser PDF print/download for executive reporting |
| `📋 List today's tasks, meetings & mails` | 360° complete list digest across all connected tools |
| `🚀 Generate daily team standup report` | 3-part standup report (*Yesterday, Today, Blockers*) |
| `🚧 What is blocking my work?` | Active dependency & blocker detection |
| `👥 Who is waiting for me?` | Reverse lookup of pending mentions & unanswered emails |
| `🔗 Show me everything about ANZ-342` | Cross-source workspace aggregation for a ticket or project |

---

## 🛠️ Tech Stack & Architecture

- **Frontend Framework:** React 18, TypeScript 5, Vite 6
- **Styling & UI:** Tailwind CSS 4, Framer Motion, Lucide Icons
- **State & Context Architecture:**
  - `AuthContext`: User authentication & display name management (`Harsh Vardhan`)
  - `AppContext`: Task management, activity tracking, and agentic task execution
  - `WorkPilotChatContext`: AI Chatbot state, message memory, and action dispatcher
  - `GmailContext`: Live Gmail connection & IMAP email sync
  - `GoogleCalendarContext`: Live Google Calendar events & iCal sync
  - `LlmContext`: Custom LLM API endpoint configuration (Ollama, OpenAI, custom endpoints)
  - `ThemeContext`: Dark/light mode theme toggling

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation
Clone the repository and install project dependencies:

```bash
git clone git@github.com:Priya-TTN/workSphere.git
cd workSphere
npm install
```

### 3. Running Development Server
Start Vite dev server (with built-in Gmail IMAP & iCal proxy plugins):

```bash
npm run dev
```

The application will be available at **`http://localhost:5173/`**.

### 4. Building for Production
Run TypeScript type-check and Vite production build:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

---

## 📂 Project Structure

```
workSphere/
├── vite/
│   └── gmailImapPlugin.ts       # Vite Node dev server proxy for Gmail IMAP
├── src/
│   ├── components/
│   │   ├── chat/                # WorkPilot Chat Panel, Dock & UI elements
│   │   ├── ui/                  # Logo, Buttons, Modals, Skeleton Loaders
│   │   └── connectors/          # Gmail & Google Calendar Connectors
│   ├── context/                 # React Context Providers (Auth, App, Chat, Gmail, Calendar)
│   ├── data/                    # App data schemas & JSON datasets (user, tasks, jira, teams)
│   ├── lib/                     # Validation utilities & helper functions
│   ├── pages/                   # Lazy-loaded page components (Dashboard, Tasks, Calendar, Chat)
│   ├── services/
│   │   ├── ai/                  # Built-in AI Chatbot engine & quick prompts
│   │   ├── email/               # Email extractor & action item parser
│   │   ├── googleCalendar.ts    # Google Calendar REST & iCal parser
│   │   └── reports/             # Executive Workday PDF Generator
│   ├── types/                   # TypeScript interfaces & domain models
│   └── App.tsx                  # Main router & layout root
├── public/                      # Static assets & logos
├── package.json
└── vite.config.ts
```

---

## 🔒 Security & Governance

- **Authorization Protection:** Built-in safeguards preventing access to unauthorized private user data.
- **Sandbox Compliance:** Dev server proxy scripts run safely with socket timeout protection.

---

## 📄 License

Developed for **Catalist WorkSphere** • WorkPilot AI Project.
