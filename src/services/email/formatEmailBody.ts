/** Turns leftover MIME / tracking junk into readable email text in the browser. */

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
}

function stripHtml(html: string): string {
  const withLinks = html.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, (_, label: string) => {
    const text = label.replace(/<[^>]+>/g, '').trim()
    return text ? ` ${text} ` : ' '
  })
  return decodeHtmlEntities(
    withLinks
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<head[\s\S]*?<\/head>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, ' ')
  )
}

function decodeQuotedPrintableLite(input: string): string {
  return input
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex: string) => {
      const code = parseInt(hex, 16)
      return code >= 32 && code < 127 ? String.fromCharCode(code) : ' '
    })
}

export function formatEmailBody(raw: string): string {
  if (!raw.trim()) return ''

  let text = raw.includes('<html') || raw.includes('<div') || raw.includes('<table') ? stripHtml(raw) : raw
  text = decodeQuotedPrintableLite(text)

  text = text
    .replace(/\r\n/g, '\n')
    .replace(/ \n/g, ' ')
    .replace(/Content-Type:[^\n]*/gi, ' ')
    .replace(/Content-Transfer-Encoding:[^\n]*/gi, ' ')
    .replace(/charset="?[^";\s]+"?/gi, ' ')
    .replace(/format=flowed;?\s*/gi, ' ')
    .replace(/delsp=yes;?\s*/gi, ' ')
    .replace(/--[0-9a-fA-F_-]{12,}/g, ' ')
    .replace(/<https?:\/\/[^>\s]+>/g, '')
    .replace(/https?:\/\/[^\s<>"]+/g, (url) => {
      if (/e3t\/|googleusercontent|unsubscribe|trk|click\.|viewonline|mandrill|sendgrid/i.test(url)) return ''
      if (url.length > 80) return ''
      return url
    })
    .replace(/[A-Za-z0-9+/=_-]{70,}/g, ' ')
    .replace(/^[>\s]+/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return true
      if (/^https?:\/\//i.test(line)) return false
      if (line.length > 120 && !/\s/.test(line)) return false
      const letters = (line.match(/[A-Za-z]/g) ?? []).length
      return letters >= 3 || /[•\d]/.test(line)
    })

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function formatEmailPreview(raw: string, max = 160): string {
  const body = formatEmailBody(raw).replace(/\s+/g, ' ').trim()
  if (!body) return ''
  return body.length > max ? `${body.slice(0, max).trim()}…` : body
}

export function emailBodyParagraphs(raw: string): string[] {
  const body = formatEmailBody(raw)
  if (!body) return []
  return body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 12)
}
