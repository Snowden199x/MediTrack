import { CONCERNS, type ConcernKey, type FollowUpQuestion } from '../shared/symptomQuestions'

export type Severity = 'Mild' | 'Moderate' | 'Severe' | 'Not sure'
export type ReportStatus = 'New' | 'Reviewed' | 'Scheduled' | 'Resolved'

export interface SymptomReport {
  id: number
  residentId: number
  residentName: string
  area: string
  contact: string
  mainConcern: ConcernKey
  startDate: string
  severity: Severity
  followUpAnswers: Record<string, string>
  notes: string
  createdAt: string
  status: ReportStatus
  reviewNote?: string | null
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

export const AREAS: string[] = []
export const SEVERITIES: Severity[] = ['Mild', 'Moderate', 'Severe', 'Not sure']
export const REPORT_STATUSES: ReportStatus[] = ['New', 'Reviewed']
export const CONCERN_LABELS = Object.fromEntries(CONCERNS.map(concern => [concern.key, concern.label] as const)) as Record<ConcernKey, string>

function followUpLabels(question: FollowUpQuestion): Array<readonly [string, string]> {
  return [[question.key, question.question] as const, ...(question.branches ?? []).flatMap(branch => branch.questions.flatMap(followUpLabels))]
}

export const FOLLOW_UP_LABELS: Record<string, string> = Object.fromEntries(CONCERNS.flatMap(concern => concern.followUps.flatMap(followUpLabels)))

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

export interface AreaCluster { area: string; concern: ConcernKey; count: number; reportIds: number[]; withinDays: number }

export function findSimilarReportClusters(reports: SymptomReport[], minimumReports: number, withinDays: number): AreaCluster[] {
  const cutoff = Date.now() - withinDays * 86_400_000
  const groups = new Map<string, { area: string; concern: ConcernKey; reportIds: number[] }>()
  for (const report of reports) {
    if (report.status === 'Reviewed' || new Date(report.createdAt).getTime() < cutoff) continue
    const key = `${report.area}|${report.mainConcern}`
    const group = groups.get(key) ?? { area: report.area, concern: report.mainConcern, reportIds: [] }
    group.reportIds.push(report.id)
    groups.set(key, group)
  }
  return [...groups.values()].filter(group => group.reportIds.length >= minimumReports)
    .map(group => ({ ...group, count: group.reportIds.length, withinDays })).sort((a, b) => b.count - a.count)
}

export const ADVICE_TEMPLATES: string[] = []
