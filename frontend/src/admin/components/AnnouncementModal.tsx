import { useRef, useState } from 'react'
import { api } from '../../shared/api'
import '../css/announcement-modal.css'

const POST_TYPES = [
  { value: 'announcement', label: 'Announcement', cls: 'type-announce' },
  { value: 'alert',        label: '🚨 Alert',      cls: 'type-alert'    },
  { value: 'event',        label: '📅 Event',      cls: 'type-event'    },
  { value: 'health_tip',   label: '💡 Health tip', cls: 'type-tip'      },
]

interface Props {
  onClose: () => void
  onSuccess: (msg: string) => void
}

export default function AnnouncementModal({ onClose, onSuccess }: Props) {
  const [type, setType]       = useState('announcement')
  const [title, setTitle]     = useState('')
  const [body, setBody]       = useState('')
  const [photo, setPhoto]     = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]     = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  function removePhoto() {
    setPhoto(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const typeLabel = POST_TYPES.find(t => t.value === type)?.label.replace(/^[^\w]+/, '') ?? type
      const fullTitle = type !== 'announcement' ? `[${typeLabel}] ${title.trim()}` : title.trim()

      // Photo upload is UI-only for now — backend doesn't have file storage yet.
      // When storage is added, use FormData instead of JSON.
      await api('/admin/announcements', {
        method: 'POST',
        body: {
          title: fullTitle,
          body: body.trim(),
          published_at: new Date().toISOString(),
        },
      })

      onSuccess('Announcement published successfully.')
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="ann-backdrop" role="presentation" onClick={handleBackdrop}>
      <div
        className="ann-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ann-modal-title"
      >
        {/* Header */}
        <div className="ann-modal-header">
          <h2 id="ann-modal-title">New announcement</h2>
          <button className="ann-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <form className="ann-modal-body" onSubmit={handleSubmit} id="ann-form">
          {/* Post type */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: '.84rem', fontWeight: 700, color: 'var(--muted)' }}>Post type</p>
            <div className="ann-type-group">
              {POST_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  className={`ann-type-pill ${t.cls}${type === t.value ? ' selected' : ''}`}
                  onClick={() => setType(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <label style={{ display: 'grid', gap: '7px', fontSize: '.88rem', fontWeight: 700 }}>
            Title
            <input
              required
              maxLength={255}
              placeholder="Enter a clear, short title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </label>

          {/* Body */}
          <label style={{ display: 'grid', gap: '7px', fontSize: '.88rem', fontWeight: 700 }}>
            Message
            <textarea
              required
              maxLength={5000}
              rows={5}
              placeholder="Write your announcement here…"
              value={body}
              onChange={e => setBody(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </label>

          {/* Photo */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: '.84rem', fontWeight: 700, color: 'var(--muted)' }}>
              Attach photo <span style={{ fontWeight: 400 }}>(optional)</span>
            </p>
            {preview ? (
              <div className="ann-photo-preview">
                <img src={preview} alt="Preview" />
                <button type="button" className="ann-photo-remove" onClick={removePhoto} aria-label="Remove photo">✕</button>
              </div>
            ) : (
              <div className="ann-photo-area">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  aria-label="Upload photo"
                  onChange={handlePhoto}
                />
                <div className="ann-photo-area-text">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <span><strong>Click to upload</strong> or drag and drop</span>
                  <span style={{ fontSize: '.78rem' }}>PNG, JPG, WEBP up to 5 MB</span>
                </div>
              </div>
            )}
            {photo && (
              <p style={{ margin: '6px 0 0', fontSize: '.8rem', color: 'var(--muted)' }}>
                ⚠ Photo preview only — file upload requires backend storage setup.
              </p>
            )}
          </div>

          {error && <p className="notice error" role="alert" style={{ margin: 0 }}>{error}</p>}
        </form>

        {/* Footer */}
        <div className="ann-modal-footer">
          <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="ann-form" className="button" disabled={submitting}>
            {submitting ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}
