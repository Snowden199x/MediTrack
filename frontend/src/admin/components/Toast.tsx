import { useEffect, useState } from 'react'
import '../css/toast.css'

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastProps {
  item: ToastItem
  onDismiss: (id: number) => void
}

function CheckIcon() {
  return (
    <svg className="toast-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg className="toast-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function ToastCard({ item, onDismiss }: ToastProps) {
  const [exiting, setExiting] = useState(false)

  function dismiss() {
    setExiting(true)
    setTimeout(() => onDismiss(item.id), 280)
  }

  useEffect(() => {
    const timer = setTimeout(dismiss, 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`toast${item.type === 'error' ? ' toast-error' : ''}${exiting ? ' toast-exit' : ''}`}
      role="status"
      aria-live="polite"
    >
      {item.type === 'error' ? <ErrorIcon /> : <CheckIcon />}
      <div className="toast-body">
        <p className="toast-message">{item.message}</p>
        <div className="toast-progress">
          <div className="toast-progress-bar" />
        </div>
      </div>
      <button className="toast-dismiss" onClick={dismiss} aria-label="Dismiss">✕</button>
    </div>
  )
}

interface ContainerProps {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
}

export function ToastContainer({ toasts, onDismiss }: ContainerProps) {
  if (!toasts.length) return null
  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map(t => (
        <ToastCard key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// Hook to manage toasts
let _nextId = 1

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function addToast(message: string, type: 'success' | 'error' = 'success') {
    const id = _nextId++
    setToasts(prev => [...prev, { id, message, type }])
  }

  function dismissToast(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return { toasts, addToast, dismissToast }
}
