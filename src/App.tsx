import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { AppProvider } from '@/context/AppContext'
import { GoogleCalendarProvider } from '@/context/GoogleCalendarContext'
import { GmailProvider } from '@/context/GmailContext'
import { LlmProvider } from '@/context/LlmContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { LoginPage } from '@/pages/LoginPage'
import { RootRedirect } from '@/pages/RootRedirect'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const TasksPage = lazy(() => import('@/pages/TasksPage').then((m) => ({ default: m.TasksPage })))
const EmailsPage = lazy(() => import('@/pages/EmailsPage').then((m) => ({ default: m.EmailsPage })))
const TeamsPage = lazy(() => import('@/pages/TeamsPage').then((m) => ({ default: m.TeamsPage })))
const JiraPage = lazy(() => import('@/pages/JiraPage').then((m) => ({ default: m.JiraPage })))
const CalendarPage = lazy(() => import('@/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })))
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage })))
const ExcelPage = lazy(() => import('@/pages/ExcelPage').then((m) => ({ default: m.ExcelPage })))
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const AskWorkPilotPage = lazy(() => import('@/pages/AskWorkPilotPage').then((m) => ({ default: m.AskWorkPilotPage })))
const LlmSettingsPage = lazy(() => import('@/pages/LlmSettingsPage').then((m) => ({ default: m.LlmSettingsPage })))
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
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
                        <Route
                          path="/dashboard"
                          element={
                            <Suspense fallback={<DashboardSkeleton />}>
                              <DashboardPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/tasks"
                          element={
                            <Suspense fallback={<PageSkeleton />}>
                              <TasksPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/emails"
                          element={
                            <Suspense fallback={<PageSkeleton />}>
                              <EmailsPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/teams"
                          element={
                            <Suspense fallback={<PageSkeleton />}>
                              <TeamsPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/jira"
                          element={
                            <Suspense fallback={<PageSkeleton />}>
                              <JiraPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/calendar"
                          element={
                            <Suspense fallback={<PageSkeleton />}>
                              <CalendarPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/documents"
                          element={
                            <Suspense fallback={<PageSkeleton />}>
                              <DocumentsPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/excel"
                          element={
                            <Suspense fallback={<PageSkeleton />}>
                              <ExcelPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/search"
                          element={
                            <Suspense fallback={<PageSkeleton />}>
                              <SearchPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/ask-workpilot"
                          element={
                            <Suspense fallback={<PageSkeleton />}>
                              <AskWorkPilotPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/ai-settings"
                          element={
                            <Suspense fallback={<PageSkeleton />}>
                              <LlmSettingsPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/reports"
                          element={
                            <Suspense fallback={<PageSkeleton />}>
                              <ReportsPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/settings"
                          element={
                            <Suspense fallback={<PageSkeleton />}>
                              <SettingsPage />
                            </Suspense>
                          }
                        />
                      </Route>
                      <Route path="*" element={<RootRedirect />} />
                    </Routes>
                  </BrowserRouter>
                </LlmProvider>
              </GmailProvider>
            </GoogleCalendarProvider>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
