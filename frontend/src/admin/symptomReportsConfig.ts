/**
 * Symptom report types, mock data and the "similar reports" alert rule.
 *
 * This is the one place to edit when you want to change:
 *  - the rule that triggers the area alert (SIMILAR_REPORT_RULE)
 *  - the list of concerns (shared/symptomQuestions.ts, imported below)
 *  - the sample reports used until the admin API is connected (MOCK_REPORTS).
 */

import { CONCERNS, type ConcernKey, type FollowUpQuestion } from '../shared/symptomQuestions'

export type Severity = 'Mild' | 'Moderate' | 'Severe' | 'Not sure'
export type ReportStatus = 'New' | 'Reviewed' | 'Scheduled' | 'Resolved'

export interface SymptomReport {
  id: number
  residentId: number
  residentName: string
  /** Purok / area inside the barangay. */
  area: string
  contact: string
  mainConcern: ConcernKey
  /** ISO date (YYYY-MM-DD) the resident said it started. */
  startDate: string
  severity: Severity
  /** Stored by question key, e.g. { chills_or_aches: 'Yes' }. */
  followUpAnswers: Record<string, string>
  notes: string
  /** ISO date-time the report was submitted. */
  createdAt: string
  status: ReportStatus
  scheduledFor?: string
  resolvedAt?: string
}

export interface CheckupHistoryEntry {
  id: number
  residentId: number
  date: string
  type: string
  status: string
}

/** The list of areas used by the area filter and the mock reports. */
export const AREAS = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5']

export const SEVERITIES: Severity[] = ['Mild', 'Moderate', 'Severe', 'Not sure']
export const REPORT_STATUSES: ReportStatus[] = ['New', 'Reviewed', 'Scheduled', 'Resolved']

/**
 * The alert rule: when at least `minimumReports` people in the same area report
 * the same concern within `withinDays` days, the admin sees a banner.
 */
export const SIMILAR_REPORT_RULE = {
  minimumReports: 3,
  withinDays: 3,
}

export const CONCERN_LABELS = Object.fromEntries(
  CONCERNS.map(concern => [concern.key, concern.label] as const),
) as Record<ConcernKey, string>

/** Flattens a question and any branch questions it can show. */
function followUpLabels(question: FollowUpQuestion): Array<readonly [string, string]> {
  return [
    [question.key, question.question] as const,
    ...(question.branches ?? []).flatMap(branch => branch.questions.flatMap(followUpLabels)),
  ]
}

export const FOLLOW_UP_LABELS: Record<string, string> = Object.fromEntries(
  CONCERNS.flatMap(concern => concern.followUps.flatMap(followUpLabels)),
)

/** True when a report needs to stand out: severe or trouble breathing. */
export function isUrgentReport(report: SymptomReport): boolean {
  return report.severity === 'Severe' || report.mainConcern === 'breathing'
}

export function severityTone(report: SymptomReport): 'breathing' | 'severe' | 'moderate' | 'mild' | 'unsure' {
  if (report.mainConcern === 'breathing') return 'breathing'
  switch (report.severity) {
    case 'Severe': return 'severe'
    case 'Moderate': return 'moderate'
    case 'Mild': return 'mild'
    default: return 'unsure'
  }
}

export interface AreaCluster {
  area: string
  concern: ConcernKey
  count: number
  reportIds: number[]
  withinDays: number
}

/**
 * Groups recent reports by area and concern and returns the groups that pass
 * the rule. Biggest group first.
 */
export function findSimilarReportClusters(reports: SymptomReport[]): AreaCluster[] {
  const cutoff = Date.now() - SIMILAR_REPORT_RULE.withinDays * 86_400_000
  const groups = new Map<string, { area: string; concern: ConcernKey; reportIds: number[] }>()

  for (const report of reports) {
    if (new Date(report.createdAt).getTime() < cutoff) continue
    const key = `${report.area}|${report.mainConcern}`
    const group = groups.get(key) ?? { area: report.area, concern: report.mainConcern, reportIds: [] }
    group.reportIds.push(report.id)
    groups.set(key, group)
  }

  return [...groups.values()]
    .filter(group => group.reportIds.length >= SIMILAR_REPORT_RULE.minimumReports)
    .map(group => ({ ...group, count: group.reportIds.length, withinDays: SIMILAR_REPORT_RULE.withinDays }))
    .sort((a, b) => b.count - a.count)
}

/** Quick replies for the "Send advice" box. Edit freely. */
export const ADVICE_TEMPLATES = [
  'Please rest and drink water. Come to the health center if you feel worse.',
  'A health worker will visit your home tomorrow morning.',
  'Please come to the health center for a checkup when you can.',
]

// ── Mock data ────────────────────────────────────────────────────────────────
// Replace MOCK_REPORTS with the API response when the admin endpoint is ready;
// the rest of the page only needs the SymptomReport shape.

const HOUR = 3_600_000

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR).toISOString()
}

function dateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const MOCK_REPORTS: SymptomReport[] = [
  {
    id: 1,
    residentId: 1,
    residentName: 'Maria Santos',
    area: 'Purok 3',
    contact: '0917 555 0101',
    mainConcern: 'fever',
    startDate: dateDaysAgo(1),
    severity: 'Severe',
    followUpAnswers: { chills_or_aches: 'Yes', temperature_measured: 'Yes' },
    notes: 'The fever started last night and I feel very weak. I live alone with my two children.',
    createdAt: hoursAgo(4),
    status: 'New',
  },
  {
    id: 2,
    residentId: 2,
    residentName: 'Jose Reyes',
    area: 'Purok 3',
    contact: '0917 555 0102',
    mainConcern: 'fever',
    startDate: dateDaysAgo(2),
    severity: 'Moderate',
    followUpAnswers: { chills_or_aches: 'Yes', temperature_measured: 'No' },
    notes: 'I also have a small cough.',
    createdAt: hoursAgo(9),
    status: 'New',
  },
  {
    id: 3,
    residentId: 3,
    residentName: 'Ana Dela Cruz',
    area: 'Purok 3',
    contact: '0917 555 0103',
    mainConcern: 'fever',
    startDate: dateDaysAgo(0),
    severity: 'Mild',
    followUpAnswers: { chills_or_aches: 'No', temperature_measured: 'Not sure' },
    notes: 'I felt hot this morning but it is better now.',
    createdAt: hoursAgo(20),
    status: 'New',
  },
  {
    id: 4,
    residentId: 4,
    residentName: 'Liza Mendoza',
    area: 'Purok 3',
    contact: '0917 555 0104',
    mainConcern: 'fever',
    startDate: dateDaysAgo(3),
    severity: 'Moderate',
    followUpAnswers: { chills_or_aches: 'Yes', temperature_measured: 'No' },
    notes: 'The fever comes and goes. My mother is also feeling hot.',
    createdAt: hoursAgo(44),
    status: 'Reviewed',
  },
  {
    id: 5,
    residentId: 5,
    residentName: 'Pedro Bautista',
    area: 'Purok 1',
    contact: '0917 555 0105',
    mainConcern: 'breathing',
    startDate: dateDaysAgo(0),
    severity: 'Severe',
    followUpAnswers: { breathing_at_rest: 'Yes', breathing_sudden: 'Yes' },
    notes: 'It is hard to breathe even while sitting down.',
    createdAt: hoursAgo(2),
    status: 'New',
  },
  {
    id: 6,
    residentId: 6,
    residentName: 'Carla Aquino',
    area: 'Purok 2',
    contact: '0917 555 0106',
    mainConcern: 'cough',
    startDate: dateDaysAgo(2),
    severity: 'Moderate',
    followUpAnswers: { sore_throat: 'Yes', breathing_trouble: 'No' },
    notes: 'I keep coughing at night and cannot sleep well.',
    createdAt: hoursAgo(26),
    status: 'New',
  },
  {
    id: 7,
    residentId: 7,
    residentName: 'Mark Villanueva',
    area: 'Purok 4',
    contact: '0917 555 0107',
    mainConcern: 'body_pain',
    startDate: dateDaysAgo(3),
    severity: 'Mild',
    followUpAnswers: { pain_area: 'All over', daily_activity: 'Yes' },
    notes: 'My body aches after work but I can still move around.',
    createdAt: hoursAgo(30),
    status: 'Scheduled',
    scheduledFor: hoursAgo(-48),
  },
  {
    id: 8,
    residentId: 8,
    residentName: 'Grace Lim',
    area: 'Purok 5',
    contact: '0917 555 0108',
    mainConcern: 'headache',
    startDate: dateDaysAgo(1),
    severity: 'Moderate',
    followUpAnswers: { sudden_headache: 'No', light_or_noise: 'Yes' },
    notes: 'Bright light makes the headache worse.',
    createdAt: hoursAgo(70),
    status: 'Reviewed',
  },
  {
    id: 9,
    residentId: 9,
    residentName: 'Ramon Garcia',
    area: 'Purok 2',
    contact: '0917 555 0109',
    mainConcern: 'stomach',
    startDate: dateDaysAgo(4),
    severity: 'Severe',
    followUpAnswers: { keep_fluids: 'No', loose_stools: 'Yes' },
    notes: 'I cannot keep water down since yesterday.',
    createdAt: hoursAgo(120),
    status: 'Scheduled',
    scheduledFor: hoursAgo(-24),
  },
  {
    id: 10,
    residentId: 10,
    residentName: 'Eileen Torres',
    area: 'Purok 1',
    contact: '0917 555 0110',
    mainConcern: 'skin',
    startDate: dateDaysAgo(5),
    severity: 'Mild',
    followUpAnswers: { itchy_rash: 'Yes', new_product: 'Yes' },
    notes: 'The rash appeared on my arms after using a new soap.',
    createdAt: hoursAgo(144),
    status: 'Resolved',
    resolvedAt: hoursAgo(48),
  },
  {
    id: 11,
    residentId: 11,
    residentName: 'Nestor Ramos',
    area: 'Purok 5',
    contact: '0917 555 0111',
    mainConcern: 'other',
    startDate: dateDaysAgo(6),
    severity: 'Not sure',
    followUpAnswers: {
      other_kind: 'Tiredness',
      other_tired_level: 'A lot',
      other_impact: 'A lot',
      other_trend: 'Worse',
    },
    notes: 'I feel tired even after resting.',
    createdAt: hoursAgo(160),
    status: 'Resolved',
    resolvedAt: hoursAgo(24),
  },
  {
    id: 12,
    residentId: 12,
    residentName: 'Divina Flores',
    area: 'Purok 4',
    contact: '0917 555 0112',
    mainConcern: 'cough',
    startDate: dateDaysAgo(0),
    severity: 'Mild',
    followUpAnswers: { sore_throat: 'No', breathing_trouble: 'No' },
    notes: '',
    createdAt: hoursAgo(6),
    status: 'New',
  },
  // Older reports used by the resident history in the side panel.
  {
    id: 13,
    residentId: 1,
    residentName: 'Maria Santos',
    area: 'Purok 3',
    contact: '0917 555 0101',
    mainConcern: 'fever',
    startDate: dateDaysAgo(10),
    severity: 'Mild',
    followUpAnswers: { chills_or_aches: 'No', temperature_measured: 'Yes' },
    notes: 'Mild fever after walking home in the rain.',
    createdAt: hoursAgo(240),
    status: 'Resolved',
    resolvedAt: hoursAgo(216),
  },
  {
    id: 14,
    residentId: 1,
    residentName: 'Maria Santos',
    area: 'Purok 3',
    contact: '0917 555 0101',
    mainConcern: 'headache',
    startDate: dateDaysAgo(21),
    severity: 'Moderate',
    followUpAnswers: { sudden_headache: 'Yes', light_or_noise: 'No' },
    notes: '',
    createdAt: hoursAgo(504),
    status: 'Resolved',
    resolvedAt: hoursAgo(480),
  },
  {
    id: 15,
    residentId: 5,
    residentName: 'Pedro Bautista',
    area: 'Purok 1',
    contact: '0917 555 0105',
    mainConcern: 'breathing',
    startDate: dateDaysAgo(18),
    severity: 'Moderate',
    followUpAnswers: { breathing_at_rest: 'No', breathing_sudden: 'No' },
    notes: 'It was hard to breathe when walking uphill.',
    createdAt: hoursAgo(432),
    status: 'Resolved',
    resolvedAt: hoursAgo(408),
  },
]

export const MOCK_CHECKUPS: CheckupHistoryEntry[] = [
  { id: 1, residentId: 1, date: hoursAgo(288), type: 'General checkup', status: 'Completed' },
  { id: 2, residentId: 1, date: hoursAgo(72), type: 'Blood pressure check', status: 'Completed' },
  { id: 3, residentId: 5, date: hoursAgo(96), type: 'Follow-up visit', status: 'Completed' },
  { id: 4, residentId: 9, date: hoursAgo(48), type: 'General checkup', status: 'Completed' },
  { id: 5, residentId: 6, date: hoursAgo(120), type: 'Follow-up visit', status: 'Completed' },
]
