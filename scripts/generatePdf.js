import { jsPDF } from 'jspdf'
import fs from 'fs'
import path from 'path'

function generatePdfReports() {
  // 1. Generate Tech Stack PDF
  const doc = new jsPDF()

  doc.setFillColor(124, 58, 237)
  doc.rect(0, 0, 210, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('WorkPilot AI — Tech Stack & Architecture Report', 14, 18)

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Catalist WorkSphere • Technology Stack & Future Roadmap', 14, 35)
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 35)

  doc.setLineWidth(0.5)
  doc.setDrawColor(226, 232, 240)
  doc.line(14, 39, 196, 39)

  let y = 47

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(124, 58, 237)
  doc.text('1. Technologies Currently Used in the Project', 14, y)
  y += 8

  const currentTech = [
    ['Frontend Framework:', 'React 18, TypeScript 5, Vite 6, Tailwind CSS 4, Framer Motion, Lucide Icons'],
    ['State & Context API:', 'AuthContext, AppContext, WorkPilotChatContext, GmailContext, GoogleCalendarContext, LlmContext'],
    ['AI Engine:', 'builtInChatbot.ts (50 Context-Aware Capabilities, Priority Evidence Calculator, Agentic Actions)'],
    ['Backend Proxies:', 'Vite Node IMAP Dev Server Proxy (vite/gmailImapPlugin.ts), Google iCal Racing Engine'],
    ['PDF & Reporting:', 'Executive Workday & Tech Stack Print PDF Engine (workdayPdf.ts, techStackPdf.ts)'],
    ['Persistence:', 'HTML5 LocalStorage Caching & Hydration Layer'],
  ]

  currentTech.forEach(([label, value]) => {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(`• ${label}`, 16, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(51, 65, 85)
    const lines = doc.splitTextToSize(value, 120)
    doc.text(lines, 65, y)
    y += lines.length * 4.5 + 3.5
  })

  y += 4
  doc.line(14, y, 196, y)
  y += 8

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(124, 58, 237)
  doc.text('2. Future Technologies Planned (Roadmap)', 14, y)
  y += 8

  const futureTech = [
    ['Backend Services:', 'Python FastAPI / Node.js NestJS microservices + PostgreSQL (Prisma ORM) + Redis Cache'],
    ['Vector DB & RAG:', 'Qdrant / Pgvector / Pinecone for Document & Policy Embeddings'],
    ['Production LLMs:', 'OpenAI GPT-4o, Google Gemini 1.5 Pro, Anthropic Claude 3.5 Sonnet, DeepSeek-R1 (Ollama)'],
    ['Voice AI & Sync:', 'WebSockets / Socket.io + OpenAI Whisper / Web Speech API'],
    ['Cloud & CI/CD:', 'Netlify / Vercel Edge CDN, Docker Containers, GitHub Actions CI/CD'],
  ]

  futureTech.forEach(([label, value]) => {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(`• ${label}`, 16, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(51, 65, 85)
    const lines = doc.splitTextToSize(value, 120)
    doc.text(lines, 65, y)
    y += lines.length * 4.5 + 3.5
  })

  doc.setFillColor(248, 250, 252)
  doc.rect(0, 275, 210, 22, 'F')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text('WorkPilot AI • Catalist WorkSphere Enterprise Architecture Report', 14, 285)

  const pdfBytes = doc.output('arraybuffer')
  const localFile = path.resolve('WorkPilot_AI_Tech_Stack_Report.pdf')
  fs.writeFileSync(localFile, Buffer.from(pdfBytes))

  const artifactDir = '/Users/harshvardhan/.gemini/antigravity/brain/8f000d1e-66f5-491c-a98f-3ffca2e5856f'
  if (fs.existsSync(artifactDir)) {
    fs.writeFileSync(path.join(artifactDir, 'WorkPilot_AI_Tech_Stack_Report.pdf'), Buffer.from(pdfBytes))
  }

  console.log('Generated PDF at:', localFile)
}

generatePdfReports()
