import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { AppProvider } from '@/context/AppContext'
import { GoogleCalendarProvider } from '@/context/GoogleCalendarContext'
import { GmailProvider } from '@/context/GmailContext'
import { LlmProvider } from '@/context/LlmContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TasksPage } from '@/pages/TasksPage'
import { EmailsPage } from '@/pages/EmailsPage'
import { TeamsPage } from '@/pages/TeamsPage'
import { JiraPage } from '@/pages/JiraPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { ExcelPage } from '@/pages/ExcelPage'
import { SearchPage } from '@/pages/SearchPage'
import { AskWorkPilotPage } from '@/pages/AskWorkPilotPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { LlmSettingsPage } from '@/pages/LlmSettingsPage'
import { RootRedirect } from '@/pages/RootRedirect'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <GoogleCalendarProvider>
          <GmailProvider>
          <LlmProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/emails" element={<EmailsPage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/jira" element={<JiraPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/excel" element={<ExcelPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/ask-workpilot" element={<AskWorkPilotPage />} />
                <Route path="/ai-settings" element={<LlmSettingsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </BrowserRouter>
          </LlmProvider>
          </GmailProvider>
          </GoogleCalendarProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
