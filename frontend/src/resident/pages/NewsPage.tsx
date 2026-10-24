interface Announcement {
  id: number
  title: string
  body: string
  category?: string
  created_at: string
  audience?: string
}

interface Props {
  announcements: Announcement[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { dateStyle: 'medium' })
}

export default function NewsPage({ announcements }: Props) {
  return (
    <div className="resident-content">
      <div className="resident-page-header">
        <h1>News</h1>
        <p>Announcements and health tips from the barangay health center.</p>
      </div>

      {announcements.length > 0 ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          {announcements.map(item => (
            <article className="panel" key={item.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {item.category && (
                  <span className={`badge badge-${item.category}`}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1).replace(/_/g, ' ')}
                  </span>
                )}
                <span style={{ fontSize: '.82rem', color: 'var(--muted)', marginLeft: 'auto' }}>
                  {formatDate(item.created_at)}
                </span>
              </div>
              <h2 style={{ fontSize: '1rem', marginBottom: '8px' }}>{item.title}</h2>
              <p style={{ marginBottom: 0, color: 'var(--muted)', fontSize: '.9rem' }}>{item.body}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty">No announcements right now.</p>
      )}
    </div>
  )
}
