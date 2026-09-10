import { useState, useEffect } from 'react'
import { useAuth, getInitials } from '@/context/AuthContext'
import { useTheme, type Theme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toast } from '@/components/ui/Toast'
import { Link } from 'react-router-dom'
import { GoogleCalendarConnector } from '@/components/calendar/GoogleCalendarConnector'
import { GmailConnector } from '@/components/email/GmailConnector'
import { Settings, Brain, Sun, Moon, Monitor } from 'lucide-react'

export function SettingsPage() {
  const { userEmail, userName, userRole, updateUserName } = useAuth()
  const { theme, setTheme } = useTheme()
  const [displayName, setDisplayName] = useState(userName)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDisplayName(userName)
  }, [userName])

  const handleSave = () => {
    updateUserName(displayName)
    setSaved(true)
  }

  const currentInitials = getInitials(displayName || userName)

  return (
    <div className="p-4 lg:p-6 max-w-[700px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-slate-600" />
          <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        </div>
        <p className="text-slate-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-purple-50/80 via-slate-50 to-purple-50/40 p-5 border border-purple-100/80 mb-6">
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-purple-600 uppercase">Profile Overview</span>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{displayName || 'User Profile'}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{userRole} • {userEmail}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-xl font-bold text-white shadow-md ring-4 ring-white">
                  {currentInitials}
                </div>
                <span className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white" title="Active" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email Address</label>
              <Input value={userEmail} readOnly className="bg-slate-50 text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label htmlFor="display-name" className="text-sm font-medium text-slate-700 mb-1.5 block">
                Display Name
              </label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Role & Position</label>
              <Input value={userRole} readOnly className="bg-slate-50 text-slate-500 cursor-not-allowed" />
            </div>
          </div>
          <Button className="mt-5" onClick={handleSave} disabled={!displayName.trim()}>
            Save Changes
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-1">Appearance & Theme</h3>
          <p className="text-sm text-slate-500 mb-4">Customize how WorkPilot looks on your device.</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id as Theme)}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all ${
                  theme === id
                    ? 'border-purple-600 bg-purple-50/50 text-purple-700 font-semibold ring-2 ring-purple-600/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <Toast
          message="Settings saved successfully."
          visible={saved}
          onClose={() => setSaved(false)}
        />

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-2">AI Assistant</h3>
          <p className="text-sm text-slate-500 mb-4">
            WorkPilot includes an intelligent built-in AI chatbot operating on your workday data. You can also optionally connect a custom 3rd party LLM API endpoint.
          </p>
          <Link to="/ai-settings">
            <Button variant="outline">
              <Brain className="h-4 w-4" />
              Configure AI Model settings
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Notifications</h3>
          <div className="space-y-3">
            {['Email notifications', 'Teams mentions', 'Jira updates', 'Calendar reminders'].map(
              (item) => (
                <label key={item} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-700">{item}</span>
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                </label>
              )
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Integrations</h3>
          <p className="text-sm text-slate-500 mb-4">
            Connect Google Calendar and Gmail with a secret iCal URL. Other tools still use demo data.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {['Microsoft 365', 'Jira', 'Teams', 'Outlook'].map((integration) => (
              <div
                key={integration}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5"
              >
                <span className="text-sm text-slate-700">{integration}</span>
                <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Connected
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-700 mb-3">Google Calendar</p>
            <GoogleCalendarConnector />
          </div>
          <div className="border-t border-slate-100 pt-4 mt-4">
            <p className="text-sm font-medium text-slate-700 mb-3">Gmail</p>
            <GmailConnector />
          </div>
        </div>
      </div>
    </div>
  )
}
