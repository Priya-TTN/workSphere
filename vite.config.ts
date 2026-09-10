import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import { gmailImapPlugin } from './vite/gmailImapPlugin.ts'
import { llmProxyPlugin } from './vite/llmProxyPlugin.ts'

const root = path.dirname(fileURLToPath(import.meta.url))

const googleIcalProxy = {
  '/api/google-ical': {
    target: 'https://calendar.google.com',
    changeOrigin: true,
    secure: true,
    rewrite: (path: string) => path.replace(/^\/api\/google-ical/, ''),
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), gmailImapPlugin(), llmProxyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(root, './src'),
    },
  },
  server: { proxy: googleIcalProxy },
  preview: { proxy: googleIcalProxy },
})
