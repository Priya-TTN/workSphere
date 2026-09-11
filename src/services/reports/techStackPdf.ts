export function generateTechStackPdf(): void {
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>WorkPilot AI - Tech Stack Architecture Report</title>
        <style>
          @page { size: A4; margin: 18mm; }
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
            border-bottom: 2px solid #7c3aed;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .brand-title {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
          .brand-sub {
            font-size: 13px;
            color: #64748b;
            margin: 3px 0 0 0;
          }
          .report-badge {
            background: #7c3aed;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            padding: 5px 12px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .section {
            margin-bottom: 22px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #7c3aed;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-bottom: 12px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            background: #f8fafc;
          }
          .card-title {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .card-list {
            font-size: 12px;
            color: #334155;
            padding-left: 16px;
            margin: 0;
          }
          .card-list li {
            margin-bottom: 4px;
          }
          .badge-tech {
            background: #ede9fe;
            color: #6d28d9;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            margin-right: 4px;
          }
          .badge-future {
            background: #dbeafe;
            color: #1d4ed8;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            margin-right: 4px;
          }
          .footer {
            margin-top: 30px;
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
          <div>
            <h1 class="brand-title">WorkPilot AI — Tech Stack Report</h1>
            <p class="brand-sub">Catalist WorkSphere • Project Architecture & Technology Roadmap</p>
          </div>
          <span class="report-badge">Executive Report</span>
        </div>

        <div class="section">
          <div class="section-title">⚡ 1. Technologies Currently Used in the Project</div>
          <div class="grid">
            <div class="card">
              <div class="card-title">💻 Frontend Framework & UI</div>
              <ul class="card-list">
                <li><span class="badge-tech">React 18</span> Component Hooks, Context API, Suspense & Lazy Splitting</li>
                <li><span class="badge-tech">TypeScript 5</span> Strict type safety & domain interfaces</li>
                <li><span class="badge-tech">Vite 6</span> Fast HMR dev server & optimized bundle chunking</li>
                <li><span class="badge-tech">Tailwind CSS 4</span> Responsive glassmorphism & dark/light themeing</li>
                <li><span class="badge-tech">Framer Motion</span> UI animations & micro-interactions</li>
              </ul>
            </div>

            <div class="card">
              <div class="card-title">🧠 AI Engine & Context State</div>
              <ul class="card-list">
                <li><span class="badge-tech">WorkPilot AI Engine</span> 50 Context-Aware Work Capabilities</li>
                <li><span class="badge-tech">Agentic Execution</span> Live task creation, completion & schedule updates</li>
                <li><span class="badge-tech">Multi-Turn Memory</span> Topic tracking (activeTopic) for follow-up reasoning</li>
                <li><span class="badge-tech">Evidence Calculator</span> Priority score breakdown (96/100) & source citations</li>
              </ul>
            </div>

            <div class="card">
              <div class="card-title">🔌 Integrations & Proxy Services</div>
              <ul class="card-list">
                <li><span class="badge-tech">Vite Node IMAP Proxy</span> Socket-protected Gmail IMAP server sync</li>
                <li><span class="badge-tech">Google iCal & REST</span> Parallel racing for fast 60-day calendar event sync</li>
                <li><span class="badge-tech">Email Insight Extractor</span> Parses action items & meeting requests</li>
              </ul>
            </div>

            <div class="card">
              <div class="card-title">📄 PDF Engine & Persistence</div>
              <ul class="card-list">
                <li><span class="badge-tech">Print PDF Engine</span> Custom @media print executive PDF generator</li>
                <li><span class="badge-tech">HTML5 LocalStorage</span> Instant state hydration & zero layout shift</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🚀 2. Future Technologies Planned (Roadmap & Scaling)</div>
          <div class="grid">
            <div class="card">
              <div class="card-title">🗄️ Production Backend & Database</div>
              <ul class="card-list">
                <li><span class="badge-future">FastAPI / NestJS</span> Scalable REST & GraphQL microservices</li>
                <li><span class="badge-future">PostgreSQL + Prisma</span> Multi-tenant database for user data</li>
                <li><span class="badge-future">Redis</span> Session cache & real-time message queue</li>
              </ul>
            </div>

            <div class="card">
              <div class="card-title">🧠 Vector DB & Enterprise RAG</div>
              <ul class="card-list">
                <li><span class="badge-future">Qdrant / Pgvector</span> Semantic document & policy embeddings</li>
                <li><span class="badge-future">OpenAI GPT-4o / Gemini 1.5</span> Advanced cloud LLM reasoning</li>
                <li><span class="badge-future">DeepSeek-R1 / Ollama</span> Private on-premises local LLM execution</li>
              </ul>
            </div>

            <div class="card">
              <div class="card-title">🎙️ Voice AI & Real-Time Sync</div>
              <ul class="card-list">
                <li><span class="badge-future">OpenAI Whisper</span> Hands-free voice commands & transcription</li>
                <li><span class="badge-future">WebSockets / Socket.io</span> Live collaboration & push alerts</li>
              </ul>
            </div>

            <div class="card">
              <div class="card-title">☁️ Infrastructure & CI/CD</div>
              <ul class="card-list">
                <li><span class="badge-future">Netlify / Vercel Edge</span> Global CDN hosting</li>
                <li><span class="badge-future">Docker & Kubernetes</span> Microservice containerization</li>
                <li><span class="badge-future">GitHub Actions</span> CI/CD automated build & test pipeline</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="footer">
          <span>Report Generated by WorkPilot AI • Catalist WorkSphere</span>
          <span>Date: ${formattedDate}</span>
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
