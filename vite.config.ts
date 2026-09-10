import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import { gmailImapPlugin } from './vite/gmailImapPlugin.ts'
import { llmProxyPlugin } from './vite/llmProxyPlugin.ts'
import { googleIcalProxyPlugin } from './vite/googleIcalProxyPlugin.ts'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss(), gmailImapPlugin(), llmProxyPlugin(), googleIcalProxyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(root, './src'),
    },
  },
})
