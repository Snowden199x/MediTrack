/**
 * Tiny outbox for messages the admin sends to residents.
 *
 * Nothing is delivered yet — the admin page only prepares the data (for example
 * a scheduled checkup or a piece of advice). When the resident news feed or the
 * notifications API is ready, replace the in-memory array with the real call.
 */

export type ResidentNotificationKind = 'checkup' | 'advice'

export interface ResidentNotification {
  id: number
  residentId: number
  kind: ResidentNotificationKind
  title: string
  message: string
  createdAt: string
  /** Set for checkups so the resident page can show the date and time. */
  scheduledFor?: string
  read: boolean
}

const outbox: ResidentNotification[] = []
let nextId = 1

/** Queue one notification. Returns the saved entry. */
export function pushResidentNotification(
  notification: Omit<ResidentNotification, 'id' | 'createdAt' | 'read'>,
): ResidentNotification {
  const entry: ResidentNotification = {
    ...notification,
    id: nextId++,
    createdAt: new Date().toISOString(),
    read: false,
  }
  outbox.push(entry)
  return entry
}

/** Everything waiting for one resident. The resident side can call this later. */
export function residentNotifications(residentId: number): ResidentNotification[] {
  return outbox.filter(notification => notification.residentId === residentId)
}
