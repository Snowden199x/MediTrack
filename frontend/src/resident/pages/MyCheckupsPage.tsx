import Badge from '../../shared/Badge'

interface Appointment {
  id: number
  type: string
  scheduled_for: string
  status: string
}

interface Props {
  appointments: Appointment[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { dateStyle: 'medium' })
}

export default function MyCheckupsPage({ appointments }: Props) {
  return (
    <div className="resident-content">
      <div className="resident-page-header">
        <h1>My checkups</h1>
        <p>Your scheduled and past health center appointments.</p>
      </div>

      <div className="panel">
        <h2>Upcoming checkups</h2>
        {appointments.length > 0 ? (
          <ul className="plain-list">
            {appointments.map(item => (
              <li key={item.id}>
                <strong>{item.type}</strong>
                <span>
                  {formatDate(item.scheduled_for)}
                  <Badge value={item.status} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">No checkups have been scheduled yet.</p>
        )}
      </div>
    </div>
  )
}
