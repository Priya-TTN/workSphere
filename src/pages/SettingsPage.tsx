import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import userData from '@/data/user.json'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toast } from '@/components/ui/Toast'
import { Settings } from 'lucide-react'

const DISPLAY_NAME_KEY = 'workpilot_display_name'

export function SettingsPage() {
  const { userEmail } = useAuth()
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem(DISPLAY_NAME_KEY) ?? userData.name
  )
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem(DISPLAY_NAME_KEY, displayName.trim())
    setSaved(true)
  }

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
              {userData.avatar}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{displayName}</p>
              <p className="text-sm text-slate-500">{userData.role}</p>
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
              <Input value={userData.role} readOnly />
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
            Connect your work tools. Integrations are configured for the MVP with mock data.
          </p>
          <div className="grid grid-cols-2 gap-3">
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
        </div>
      </div>
    </div>
  )
}
