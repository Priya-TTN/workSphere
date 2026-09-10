import type { IncomingMessage, ServerResponse } from 'http'
import type { Plugin } from 'vite'

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

  // Ensure @ in email / calendar ID is encoded as %40 for calendar.google.com
  if (pathname.includes('@')) {
    pathname = pathname.replace(/@/g, '%40')
  }

  // Auto append basic.ics if missing
  if (pathname.includes('/calendar/ical/') && !pathname.endsWith('.ics')) {
    pathname = pathname.endsWith('/') ? `${pathname}basic.ics` : `${pathname}/basic.ics`
  }

  const targetUrl = `https://calendar.google.com${pathname}${search}`

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
      res.statusCode = googleRes.status
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: `Google Calendar returned HTTP ${googleRes.status}. Please check that your secret iCal URL is copied correctly from Google Calendar settings.`,
        })
      )
      return
    }

    const icsText = await googleRes.text()
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.end(icsText)
  } catch (err) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        error:
          'Could not reach Google Calendar servers. Please verify your internet connection.',
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
