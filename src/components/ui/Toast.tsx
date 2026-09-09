import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  message: string
  visible: boolean
  onClose: () => void
  duration?: number
  className?: string
}

export function Toast({ message, visible, onClose, duration = 4000, className }: ToastProps) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [visible, duration, onClose])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-xl border border-green-200 bg-white px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.12)]',
            className
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-sm font-medium text-slate-800 pr-2">{message}</p>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
