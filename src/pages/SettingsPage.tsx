import { useState, useEffect } from 'react'
import { useAuth, getInitials } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toast } from '@/components/ui/Toast'
import { Link } from 'react-router-dom'
import { GoogleCalendarConnector } from '@/components/calendar/GoogleCalendarConnector'
import { GmailConnector } from '@/components/email/GmailConnector'
import { Settings, Brain } from 'lucide-react'

export function SettingsPage() {
  const { userEmail, userName, userRole, updateUserName } = useAuth()
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
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Profile</h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-xl font-bold text-white">
              {currentInitials}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{displayName}</p>
              <p className="text-sm text-slate-500">{userRole}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email</label>
              <Input value={userEmail} readOnly />
            </div>
            <div>
              <label htmlFor="display-name" className="text-sm font-medium text-slate-700 mb-1.5 block">
                Display Name
              </label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Role</label>
              <Input value={userRole} readOnly />
            </div>
          </div>
          <Button className="mt-4" onClick={handleSave} disabled={!displayName.trim()}>
            Save Changes
          </Button>
        </div>

        <Toast
          message="Settings saved successfully."
          visible={saved}
          onClose={() => setSaved(false)}
        />

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-2">AI assistant</h3>
          <p className="text-sm text-slate-500 mb-4">
            Add your LLM API URL so Ask WorkPilot can summarize mail, read the calendar, and plan the day.
          </p>
          <Link to="/ai-settings">
            <Button variant="outline">
              <Brain className="h-4 w-4" />
              Open AI Model settings
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
