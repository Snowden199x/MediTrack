import { useState } from 'react'
import '../css/reports.css'

export default function ReportsPage() {
  const [filter, setFilter] = useState('all')

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <h1>Reports and requests</h1>
        <p>Most urgent first</p>
      </div>

      <div className="reports-filter-bar">
        {(['all', 'new', 'scheduled'] as const).map(f => (
          <button
            key={f}
            className={`reports-filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <p className="empty">No reports yet. Reports will appear here once residents submit symptom reports.</p>
    </div>
  )
}
