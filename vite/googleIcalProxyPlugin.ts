import type { IncomingMessage, ServerResponse } from 'http'
import https from 'node:https'
import type { Plugin } from 'vite'

function normalizeGooglePath(pathStr: string): string {
  let decoded = pathStr
  try {
    decoded = decodeURIComponent(pathStr)
  } catch {}
  return decoded.replace(/@/g, '%40').replace(/#/g, '%23')
}

function fetchHttps(
  urlStr: string,
  headers: Record<string, string>,
  maxRedirects = 5
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error('Too many redirects from Google Calendar'))
    }

    const req = https.get(
      urlStr,
      {
        headers,
        timeout: 10_000,
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, urlStr).toString()
          fetchHttps(redirectUrl, headers, maxRedirects - 1)
            .then(resolve)
            .catch(reject)
          return
        }

        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          resolve({ status: res.statusCode || 200, text: data })
        })
      }
    )

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Connection to Google Calendar timed out'))
    })
  })
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
  const reqHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/calendar, text/plain, */*',
  }

  try {
    const { status, text } = await fetchHttps(targetUrl, reqHeaders)

    if (status !== 200) {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: `Google Calendar returned HTTP ${status}. Verify that you copied the complete Secret Address in iCal format from Google Calendar settings.`,
        })
      )
      return
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.end(text)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[googleIcalProxy error]:', detail)
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        error: `Could not reach Google Calendar (${detail}). Verify your internet connection or VPN.`,
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
