/** Minimal RFC822 text extractor for Gmail IMAP sources. */

function decodeQuotedPrintable(input: string, charset = 'utf-8'): string {
  const normalized = input.replace(/=\r?\n/g, '')
  const bytes: number[] = []
  for (let i = 0; i < normalized.length; i++) {
    if (normalized[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(normalized.slice(i + 1, i + 3))) {
      bytes.push(parseInt(normalized.slice(i + 1, i + 3), 16))
      i += 2
    } else {
      bytes.push(normalized.charCodeAt(i) & 0xff)
    }
  }
  try {
    return new TextDecoder(charset).decode(Buffer.from(bytes))
  } catch {
    return Buffer.from(bytes).toString('utf8')
  }
}

function decodeBase64(input: string, charset = 'utf-8'): string {
  try {
    const buf = Buffer.from(input.replace(/\s+/g, ''), 'base64')
    try {
      return new TextDecoder(charset).decode(buf)
    } catch {
      return buf.toString('utf8')
    }
  } catch {
    return input
  }
}

function charsetFromContentType(contentType: string): string {
  const match = contentType.match(/charset="?([^";\s]+)"?/i)
  if (!match) return 'utf-8'
  const raw = match[1].toLowerCase()
  if (raw === 'utf8' || raw === 'utf-8') return 'utf-8'
  if (raw.includes('iso-8859') || raw.includes('windows-1252') || raw.includes('latin')) return 'latin1'
  return 'utf-8'
}

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

export function stripHtml(html: string): string {
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

function headerValue(headers: string, name: string): string {
  const match = headers.match(new RegExp(`(?:^|\\n)${name}:\\s*([\\s\\S]*?)(?=\\n\\S|\\n$)`, 'i'))
  if (!match) return ''
  return match[1].replace(/\r?\n[ \t]+/g, ' ').trim()
}

function getBoundary(contentType: string): string | null {
  const match = contentType.match(/boundary="?([^";\s]+)"?/i)
  return match ? match[1] : null
}

function decodePart(body: string, encoding: string, charset: string): string {
  const enc = encoding.toLowerCase()
  if (enc.includes('base64')) return decodeBase64(body, charset)
  if (enc.includes('quoted-printable')) return decodeQuotedPrintable(body, charset)
  return body
}

function extractFromPart(raw: string): { text: string; html: string } {
  const splitAt = raw.includes('\r\n\r\n') ? raw.indexOf('\r\n\r\n') : raw.indexOf('\n\n')
  if (splitAt === -1) return { text: '', html: '' }
  const headers = raw.slice(0, splitAt)
  const body = raw.slice(splitAt).replace(/^\r?\n\r?\n/, '')
  const contentType = headerValue(headers, 'Content-Type')
  const encoding = headerValue(headers, 'Content-Transfer-Encoding')
  const charset = charsetFromContentType(contentType)
  const decoded = decodePart(body, encoding, charset)

  if (/multipart\//i.test(contentType)) {
    return extractMultipart(decoded || body, contentType)
  }
  if (/text\/html/i.test(contentType)) {
    return { text: '', html: decoded }
  }
  if (/text\/plain/i.test(contentType)) {
    return { text: decoded, html: '' }
  }
  return { text: '', html: '' }
}

function extractMultipart(body: string, contentType: string): { text: string; html: string } {
  const boundary = getBoundary(contentType)
  if (!boundary) return { text: '', html: '' }
  const escaped = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = body.split(new RegExp(`\\r?\\n?--${escaped}`))
  let text = ''
  let html = ''
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed || trimmed === '--' || trimmed.startsWith('--')) continue
    const extracted = extractFromPart(part)
    if (extracted.text && looksReadable(extracted.text) && extracted.text.length > text.length) {
      text = extracted.text
    } else if (extracted.text && !text) {
      text = extracted.text
    }
    if (extracted.html && extracted.html.length > html.length) {
      html = extracted.html
    }
  }
  return { text, html }
}

function looksReadable(text: string): boolean {
  const words = text.match(/[A-Za-z]{3,}/g) ?? []
  const mime = /Content-Type:|Content-Transfer-Encoding:|--[0-9a-fA-F]{10,}/.test(text)
  if (mime) return false
  const urls = text.match(/https?:\/\//g) ?? []
  if (urls.length >= 4 && words.length < 12) return false
  return words.length >= 8
}

function tidyText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/ \n/g, ' ')
    .replace(/<https?:\/\/[^>\s]+>/g, '')
    .replace(/https?:\/\/[^\s<>"]+/g, (url) => {
      if (/tothenew\.com\/e3t|googleusercontent|unsubscribe|trk|click\./i.test(url)) return ''
      return url
    })
    .replace(/Content-Type:[\s\S]*?(?=\n\S|\n\n|$)/gi, ' ')
    .replace(/Content-Transfer-Encoding:[^\n]+/gi, ' ')
    .replace(/charset="?[^";\s]+"?/gi, ' ')
    .replace(/format=flowed;?\s*/gi, ' ')
    .replace(/delsp=yes;?\s*/gi, ' ')
    .replace(/--[0-9a-fA-F]{12,}/g, ' ')
    .replace(/[A-Za-z0-9+/=]{80,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function extractPlainText(source: Buffer | string): string {
  const raw = typeof source === 'string' ? source : source.toString('utf8')
  const splitAt = raw.includes('\r\n\r\n') ? raw.indexOf('\r\n\r\n') : raw.indexOf('\n\n')
  if (splitAt === -1) return tidyText(raw).slice(0, 8000)

  const headers = raw.slice(0, splitAt)
  const body = raw.slice(splitAt).replace(/^\r?\n\r?\n/, '')
  const contentType = headerValue(headers, 'Content-Type')
  const encoding = headerValue(headers, 'Content-Transfer-Encoding')
  const charset = charsetFromContentType(contentType)

  let text = ''
  let html = ''
  if (/multipart\//i.test(contentType)) {
    const extracted = extractMultipart(body, contentType)
    text = extracted.text
    html = extracted.html
  } else if (/text\/html/i.test(contentType)) {
    html = decodePart(body, encoding, charset)
  } else {
    text = decodePart(body, encoding, charset)
  }

  const fromHtml = html ? tidyText(stripHtml(html)) : ''
  const fromText = text ? tidyText(text) : ''
  const chosen = looksReadable(fromText) ? fromText : fromHtml || fromText
  return chosen.replace(/\u0000/g, '').slice(0, 12000)
}
