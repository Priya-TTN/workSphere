import type { IncomingMessage, ServerResponse } from 'http'
import type { Plugin } from 'vite'
import { ImapFlow } from 'imapflow'
import { extractPlainText } from './parseEmail.ts'

const MAX_MESSAGES = 25
const SOURCE_MAX_BYTES = 400_000

interface GmailRequestBody {
  email?: string
  appPassword?: string
  max?: number
}

function readJson(req: IncomingMessage): Promise<GmailRequestBody> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? (JSON.parse(raw) as GmailRequestBody) : {})
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function formatAddress(list?: { name?: string; address?: string }[]): { name: string; email: string } {
  const first = list?.[0]
  return {
    name: first?.name || first?.address || 'Unknown',
    email: first?.address || '',
  }
}

function previewFrom(body: string): string {
  return body.replace(/\s+/g, ' ').trim().slice(0, 180)
}

async function handleGmailFetch(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Use POST with your Gmail address and App Password.' })
    return
  }

  let body: GmailRequestBody
  try {
    body = await readJson(req)
  } catch {
    sendJson(res, 400, { error: 'Could not read the request.' })
    return
  }

  const email = body.email?.trim() ?? ''
  const appPassword = (body.appPassword ?? '').replace(/\s+/g, '')
  const max = Math.min(Math.max(body.max ?? MAX_MESSAGES, 1), MAX_MESSAGES)

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    sendJson(res, 400, { error: 'Enter a valid Gmail address.' })
    return
  }
  if (appPassword.length < 8) {
    sendJson(res, 400, { error: 'Enter a Google App Password (16 characters), not your normal password.' })
    return
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: email, pass: appPassword },
    logger: false,
  })

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')
    try {
      const mailbox = client.mailbox as { exists: number }
      const total = mailbox.exists
      const status = await client.status('INBOX', { unseen: true, messages: true })
      const unseenCount = status.unseen ?? 0
      if (total === 0) {
        sendJson(res, 200, { messages: [], unseenCount: 0, mailboxTotal: 0 })
        return
      }

      const fromSeq = Math.max(1, total - max + 1)
      const messages: Record<string, unknown>[] = []

      for await (const msg of client.fetch(`${fromSeq}:*`, {
        uid: true,
        flags: true,
        envelope: true,
        internalDate: true,
        threadId: true,
        labels: true,
        source: { maxLength: SOURCE_MAX_BYTES },
      })) {
        const from = formatAddress(msg.envelope?.from)
        const to = (msg.envelope?.to ?? []).map((item) => item.address || item.name || '').filter(Boolean)
        const bodyText = msg.source ? extractPlainText(msg.source) : ''
        const flags = msg.flags ?? new Set<string>()
        const isUnread = !flags.has('\\Seen')
        messages.push({
          id: String(msg.uid),
          threadId: msg.threadId,
          from: from.name,
          fromEmail: from.email,
          to,
          subject: msg.envelope?.subject || '(No subject)',
          preview: previewFrom(bodyText) || msg.envelope?.subject || '',
          bodyText,
          receivedAt: (msg.internalDate ? new Date(msg.internalDate) : new Date()).toISOString(),
          isUnread,
          labels: msg.labels ? [...msg.labels] : [],
        })
      }

      messages.sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)))
      sendJson(res, 200, {
        messages,
        unseenCount,
        mailboxTotal: status.messages ?? total,
      })
    } finally {
      lock.release()
    }
    await client.logout()
  } catch (err) {
    try {
      client.close()
    } catch {
      // ignore
    }
    const errObj = (err ?? {}) as {
      message?: string
      responseText?: string
      code?: string
      command?: string
      responseStatus?: string
    }
    const messageStr = errObj.message || String(err)
    const responseText = errObj.responseText || ''
    const code = errObj.code || ''
    const command = errObj.command || ''
    const fullLog = `${messageStr} ${responseText} ${code} ${command} ${errObj.responseStatus || ''}`
    console.error('[Gmail IMAP Fetch Error]:', fullLog.trim())

    const lower = fullLog.toLowerCase()
    let error = 'Could not connect to Gmail. Check IMAP is enabled and use a Google App Password.'

    if (
      command.toUpperCase() === 'LOGIN' ||
      lower.includes('auth') ||
      lower.includes('invalid credentials') ||
      lower.includes('login') ||
      lower.includes('denied') ||
      lower.includes('password') ||
      lower.includes('bad') ||
      lower.includes('no [') ||
      code.toUpperCase().includes('AUTH')
    ) {
      error =
        'Gmail rejected the IMAP login. Ensure 2-Step Verification is active, IMAP is enabled in Gmail Settings, and you are using a 16-character Google App Password (not your regular account password).'
    } else if (
      lower.includes('enotfound') ||
      lower.includes('eai_again') ||
      lower.includes('timed out') ||
      lower.includes('timeout') ||
      lower.includes('econnrefused') ||
      lower.includes('closed') ||
      lower.includes('network') ||
      lower.includes('socket')
    ) {
      error = 'Could not reach imap.gmail.com (Port 993). Check your network, firewall, or VPN connection.'
    } else if (responseText) {
      error = `Gmail IMAP error: ${responseText}`
    } else if (messageStr) {
      error = `Gmail IMAP error: ${messageStr}`
    }

    sendJson(res, 502, { error })
  }
}

export function gmailImapPlugin(): Plugin {
  return {
    name: 'gmail-imap',
    configureServer(server) {
      server.middlewares.use('/api/gmail/messages', (req, res, next) => {
        void handleGmailFetch(req, res).catch(next)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/gmail/messages', (req, res, next) => {
        void handleGmailFetch(req, res).catch(next)
      })
    },
  }
}
