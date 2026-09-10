import { useState } from 'react'
import { Mail, CheckCircle2, Loader2, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGmail } from '@/context/GmailContext'

export function GmailConnector() {
  const { isConnected, isLoading, isFetching, connectError, emailAddress, connect, disconnect } = useGmail()
  const [feedUrl, setFeedUrl] = useState('')

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <span className="text-sm text-slate-500">Loading Gmail…</span>
      </div>
    )
  }

  if (isConnected) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-800">Gmail connected</p>
            <p className="text-xs text-green-600 mt-0.5 truncate">
              Using your secret iCal-style mail feed{emailAddress ? ` · ${emailAddress}` : ''}
            </p>
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
    const ok = await connect(feedUrl)
    if (ok) setFeedUrl('')
  }

  return (
    <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-5 shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
          <Mail className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-800">Paste your secret Gmail iCal URL here</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Same idea as Calendar: one private URL. Gmail does not show this link in Settings, so
            you build it once from your email + App Password.
          </p>
        </div>
      </div>

      <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside leading-relaxed pl-1">
        <li>Gmail → Settings → See all settings → Forwarding and POP/IMAP → Enable IMAP</li>
        <li>
          Create a Google{' '}
          <a
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            App Password
          </a>{' '}
          and remove the spaces
        </li>
        <li>
          Paste a URL in this format:
          <code className="mt-1 block bg-white/80 px-2 py-1 rounded text-[11px] break-all">
            https://mail.google.com/mail/ical/you@email.com/private-YOURAPPPASSWORD/basic.ics
          </code>
        </li>
      </ol>

      <label htmlFor="gmail-ical-url" className="text-sm font-medium text-slate-700 block">
        Secret Gmail iCal URL
      </label>
      <Input
        id="gmail-ical-url"
        type="url"
        autoComplete="off"
        placeholder="https://mail.google.com/mail/ical/.../private-.../basic.ics"
        value={feedUrl}
        onChange={(e) => setFeedUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void handleConnect()
        }}
        className="bg-white border-blue-200"
      />

      {connectError && <p className="text-xs text-red-600">{connectError}</p>}

      <Button onClick={() => void handleConnect()} disabled={isFetching || !feedUrl.trim()}>
        {isFetching ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Connecting…
          </>
        ) : (
          'Connect Gmail'
        )}
      </Button>
    </div>
  )
}
