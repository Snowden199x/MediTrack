import '../css/schedule.css'
import { IconSchedule } from '../components/AdminIcons'

export default function SchedulePage() {
  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <h1>Schedule</h1>
        <p>Manage checkup schedules and appointments.</p>
      </div>
      <div className="schedule-empty">
        <IconSchedule />
        <p>No schedules yet. Schedules will appear here once checkups are arranged.</p>
      </div>
    </div>
  )
}
