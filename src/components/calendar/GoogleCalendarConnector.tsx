import { useState } from 'react'
import { CalendarDays, CheckCircle2, Loader2, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGoogleCalendar } from '@/context/GoogleCalendarContext'

export function GoogleCalendarConnector() {
  const { isConnected, isLoading, isFetching, connectError, connect, disconnect } = useGoogleCalendar()
  const [icalUrl, setIcalUrl] = useState('')

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <span className="text-sm text-slate-500">Loading Google Calendar…</span>
      </div>
    )
  }

  if (isConnected) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Google Calendar connected</p>
            <p className="text-xs text-green-600 mt-0.5">Using your secret iCal feed</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnect}
          className="text-slate-500 hover:text-red-600 hover:bg-red-50"
        >
          <Unlink className="h-3.5 w-3.5" />
          Disconnect
        </Button>
      </div>
    )
  }

  const handleConnect = async () => {
    const ok = await connect(icalUrl)
    if (ok) setIcalUrl('')
  }

  const error = connectError

  return (
    <div className="rounded-xl border-2 border-purple-300 bg-purple-50 p-5 shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
          <CalendarDays className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-800">Paste your secret iCal URL here</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Do not put it in the code editor. Paste it in this box, then click Connect.
          </p>
        </div>
      </div>

      <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside leading-relaxed pl-1">
        <li>Open Google Calendar in a browser</li>
        <li>Settings → select your calendar → Integrate calendar</li>
        <li>Copy <strong>Secret address in iCal format</strong></li>
        <li>Paste it in the box below</li>
      </ol>

      <label htmlFor="gcal-ical-url" className="text-sm font-medium text-slate-700 block">
        Secret iCal URL
      </label>
      <Input
        id="gcal-ical-url"
        type="url"
        autoComplete="off"
        placeholder="https://calendar.google.com/calendar/ical/.../private-.../basic.ics"
        value={icalUrl}
        onChange={(e) => setIcalUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void handleConnect()
        }}
        className="bg-white border-purple-200"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button onClick={() => void handleConnect()} disabled={isFetching || !icalUrl.trim()}>
        {isFetching ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Connecting…
          </>
        ) : (
          'Connect Google Calendar'
        )}
      </Button>
    </div>
  )
}
