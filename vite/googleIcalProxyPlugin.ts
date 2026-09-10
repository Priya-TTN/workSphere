import type { IncomingMessage, ServerResponse } from 'http'
import type { Plugin } from 'vite'

function normalizeGooglePath(pathStr: string): string {
  const clean = pathStr.replace(/^\/+/, '/')
  let decoded = clean
  try {
    decoded = decodeURIComponent(clean)
  } catch {}
  return decoded.replace(/@/g, '%40').replace(/#/g, '%23')
}

async function handleGoogleIcalProxy(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  const rawUrl = (req as IncomingMessage & { originalUrl?: string }).originalUrl || req.url || ''
  const pathPart = rawUrl.replace(/^\/api\/google-ical/, '')

  if (!pathPart || pathPart === '/') {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Missing iCal path' }))
    return
  }

  const parts = pathPart.split('?')
  let pathname = parts[0]
  const search = parts[1] ? `?${parts[1]}` : ''

  // Normalize path so email @ and calendar # are single-encoded (%40, %23)
  pathname = normalizeGooglePath(pathname)

  // Auto append basic.ics if missing
  if (pathname.includes('/calendar/ical/') && !pathname.endsWith('.ics')) {
    pathname = pathname.endsWith('/') ? `${pathname}basic.ics` : `${pathname}/basic.ics`
  }

  const targetUrl = `https://calendar.google.com${pathname}${search}`
  console.log('[Google iCal Proxy Fetching]:', targetUrl)

  try {
    const googleRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/calendar, text/plain, */*',
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!googleRes.ok) {
      console.error('[Google iCal Proxy HTTP Error]:', googleRes.status, targetUrl)
      res.statusCode = googleRes.status
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: `Google Calendar returned HTTP ${googleRes.status}. Verify that you copied the complete Secret Address in iCal format from Google Calendar settings.`,
        })
      )
      return
    }

    const text = await googleRes.text()

    if (!text.includes('BEGIN:VCALENDAR')) {
      console.error('[Google iCal Proxy Invalid Content]:', targetUrl)
      res.statusCode = 422
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: 'Google Calendar returned invalid content. Please confirm you copied the Secret Address in iCal format.',
        })
      )
      return
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.end(text)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[Google iCal Proxy Catch Error]:', detail, targetUrl)
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        error: `Could not reach Google Calendar (${detail}). Check your internet connection or VPN.`,
      })
    )
  }
}

export function googleIcalProxyPlugin(): Plugin {
  return {
    name: 'google-ical-proxy',
    configureServer(server) {
      server.middlewares.use('/api/google-ical', (req, res, next) => {
        void handleGoogleIcalProxy(req, res).catch(next)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/google-ical', (req, res, next) => {
        void handleGoogleIcalProxy(req, res).catch(next)
      })
    },
  }
}
