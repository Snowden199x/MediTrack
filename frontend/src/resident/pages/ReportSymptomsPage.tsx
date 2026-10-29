import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  CONCERNS,
  CONCERNS_BY_KEY,
  QUESTIONNAIRE_NOTE,
  SEVERITY_OPTIONS,
  START_OPTIONS,
  URGENT_NOTICE,
  URGENT_TITLE,
  isUrgentReport,
  recommendationFor,
  type ConcernKey,
  type FollowUpQuestion,
} from '../../shared/symptomQuestions'
import '../css/report-symptoms.css'

/** What the API expects when a report is saved. */
export interface SymptomReportPayload {
  category: ConcernKey
  onset_date: string | null
  severity: string
  answers: Record<string, string>
  details: string | null
}

interface Props {
  residentName: string
  /** Sends the report and returns the API's "next step" message. */
  onSend: (report: SymptomReportPayload) => Promise<string>
}

interface Chip {
  value: string
  label: string
  hint?: string
  tone?: 'urgent'
}

interface Step {
  id: string
  question: string
  helper?: string
  kind: 'chips' | 'notes'
  chips?: Chip[]
}

interface Answer {
  value: string
  label: string
}

type AnswerMap = Record<string, Answer>

type Stage = 'chat' | 'review' | 'sent'

// ── The fixed parts of the conversation ──────────────────────────────────────
const CONCERN_STEP: Step = {
  id: 'concern',
  question: 'What is your main concern?',
  helper: 'Tap the one that fits best. You can change it later.',
  kind: 'chips',
  chips: CONCERNS.map(concern => ({
    value: concern.key,
    label: concern.label,
    hint: concern.hint,
  })),
}

const ONSET_STEP: Step = {
  id: 'onset',
  question: 'When did it start?',
  helper: 'A rough answer is fine.',
  kind: 'chips',
  chips: [
    ...START_OPTIONS.map(option => ({ value: option.value, label: option.label })),
    { value: 'custom', label: 'Pick a date' },
  ],
}

const SEVERITY_STEP: Step = {
  id: 'severity',
  question: 'How does it feel to you?',
  helper: 'There is no wrong answer.',
  kind: 'chips',
  chips: SEVERITY_OPTIONS.map(option => ({
    value: option.value,
    label: option.label,
    hint: option.hint,
    tone: option.value === 'severe' ? 'urgent' : undefined,
  })),
}

const NOTES_STEP: Step = {
  id: 'notes',
  question: 'Anything else the health worker should know?',
  helper: 'You can skip this if you do not have anything to add.',
  kind: 'notes',
}

/**
 * The follow-up questions depend on the concern the resident picked, and a
 * question with `branches` adds the questions that match the answer given.
 */
function expandQuestions(question: FollowUpQuestion, answers: AnswerMap): FollowUpQuestion[] {
  const answer = answers[question.key]?.value
  const branch = question.branches?.find(item => item.when === answer)
  const extra = branch ? branch.questions.flatMap(child => expandQuestions(child, answers)) : []
  return [question, ...extra]
}

/** Every answer key a concern can collect, including branch questions. */
function allFollowUpKeys(concern: ConcernKey): string[] {
  const keys: string[] = []
  const visit = (question: FollowUpQuestion) => {
    keys.push(question.key)
    for (const branch of question.branches ?? []) {
      for (const child of branch.questions) visit(child)
    }
  }
  for (const question of CONCERNS_BY_KEY[concern].followUps) visit(question)
  return keys
}

function buildSteps(concern: ConcernKey | null, answers: AnswerMap): Step[] {
  const followUps: Step[] = concern
    ? CONCERNS_BY_KEY[concern].followUps.flatMap(question =>
        expandQuestions(question, answers).map((item): Step => ({
          id: item.key,
          question: item.question,
          kind: 'chips',
          chips: item.options.map(option => ({ value: option, label: option })),
        })),
      )
    : []

  return [CONCERN_STEP, ONSET_STEP, SEVERITY_STEP, ...followUps, NOTES_STEP]
}

// ── Small helpers ────────────────────────────────────────────────────────────
function isoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return isoDate(date)
}

function friendlyDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Show the urgent notice right after the answer that makes a report urgent. */
function urgentAfter(stepId: string, value: string): boolean {
  return (stepId === 'concern' && value === 'breathing') || (stepId === 'severity' && value === 'severe')
}

// ── Bubbles ──────────────────────────────────────────────────────────────────
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  )
}

function AssistantBubble({ children }: { children: ReactNode }) {
  return (
    <div className="schat-row is-assistant">
      <span className="schat-avatar" aria-hidden="true"><PlusIcon /></span>
      <div className="schat-bubble is-assistant">{children}</div>
    </div>
  )
}

function ResidentBubble({ children }: { children: ReactNode }) {
  return (
    <div className="schat-row is-resident">
      <div className="schat-bubble is-resident">{children}</div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="schat-row is-assistant">
      <span className="schat-avatar" aria-hidden="true"><PlusIcon /></span>
      <div className="schat-bubble is-assistant schat-typing" role="status" aria-label="Health assistant is typing">
        <span /><span /><span />
      </div>
    </div>
  )
}

function UrgentCard() {
  return (
    <div className="schat-urgent" role="alert">
      <strong>{URGENT_TITLE}</strong>
      <p>{URGENT_NOTICE}</p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ReportSymptomsPage({ residentName, onSend }: Props) {
  const [index, setIndex] = useState(0)
  const [concern, setConcern] = useState<ConcernKey | null>(null)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [notes, setNotes] = useState('')
  const [pickedDate, setPickedDate] = useState('')
  const [dateDraft, setDateDraft] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [typing, setTyping] = useState(true)
  const [stage, setStage] = useState<Stage>('chat')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [nextStep, setNextStep] = useState('')

  const endRef = useRef<HTMLDivElement>(null)
  const focusRef = useRef<HTMLElement>(null)
  const firstName = residentName.split(' ')[0]
  const steps = useMemo(() => buildSteps(concern, answers), [concern, answers])
  const currentStep = steps[index]
  const urgent = isUrgentReport(answers.concern?.value ?? null, answers.severity?.value ?? null)

  const answerValues: Record<string, string> = {}
  for (const [key, answer] of Object.entries(answers)) answerValues[key] = answer.value
  const recommendation = recommendationFor(concern, answers.severity?.value ?? null, answerValues)
  const progress = Math.round((Math.min(index, steps.length) / steps.length) * 100)

  // A short typing pause before each new assistant question.
  useEffect(() => {
    if (stage !== 'chat') return
    setTyping(true)
    const timer = window.setTimeout(() => setTyping(false), 550)
    return () => window.clearTimeout(timer)
  }, [index, stage])

  // Keep the newest message visible. On the summary and sent screens, jump to
  // the top of that card instead so its heading is not scrolled past.
  useEffect(() => {
    const node = stage === 'chat' ? endRef.current : focusRef.current
    if (!node) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    node.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' })
  }, [index, typing, stage, answers])

  function advance() {
    setShowDatePicker(false)
    setDateDraft('')
    if (index >= steps.length - 1) setStage('review')
    else setIndex(index + 1)
  }

  function choose(step: Step, chip: Chip) {
    if (step.id === 'onset' && chip.value === 'custom') {
      // Keep the day already chosen when the resident comes back to change it.
      setDateDraft(pickedDate)
      setShowDatePicker(true)
      return
    }

    if (step.id === 'concern') {
      const nextConcern = chip.value as ConcernKey
      setAnswers(previous => {
        const cleaned: AnswerMap = { ...previous, concern: { value: chip.value, label: chip.label } }
        // Follow-ups belong to one concern, so drop them only when it changes.
        // Re-picking the same concern keeps the answers already given.
        if (concern && concern !== nextConcern) {
          for (const key of allFollowUpKeys(concern)) delete cleaned[key]
          for (const key of allFollowUpKeys(nextConcern)) delete cleaned[key]
        }
        return cleaned
      })
      setConcern(nextConcern)
    } else {
      setAnswers(previous => ({
        ...previous,
        [step.id]: { value: chip.value, label: chip.label },
      }))
    }

    advance()
  }

  function usePickedDate() {
    if (!dateDraft) return
    setPickedDate(dateDraft)
    setAnswers(previous => ({
      ...previous,
      onset: { value: 'custom', label: friendlyDate(dateDraft) },
    }))
    setShowDatePicker(false)
    setDateDraft('')
    advance()
  }

  function continueWithNotes(label: string) {
    // Skip drops anything typed so the report does not send a discarded note.
    if (label === 'Skipped') setNotes('')
    setAnswers(previous => ({ ...previous, notes: { value: notes, label } }))
    advance()
  }

  function goBack() {
    if (index === 0) return
    setShowDatePicker(false)
    setDateDraft('')
    setIndex(index - 1)
  }

  function editStep(stepIndex: number) {
    setStage('chat')
    setIndex(stepIndex)
    setShowDatePicker(false)
  }

  function onsetDate(): string | null {
    const answer = answers.onset
    if (!answer) return null
    if (answer.value === 'custom') return pickedDate || null
    const preset = START_OPTIONS.find(option => option.value === answer.value)
    return preset ? isoDaysAgo(preset.daysAgo) : null
  }

  function buildPayload(): SymptomReportPayload {
    const concernKey = (answers.concern?.value ?? 'other') as ConcernKey
    const followUps: Record<string, string> = {}

    // `steps` already includes the branch questions that apply to this resident.
    for (const step of steps) {
      if (step.kind !== 'chips') continue
      if (step.id === 'concern' || step.id === 'onset' || step.id === 'severity') continue
      const answer = answers[step.id]
      if (answer) followUps[step.id] = answer.value
    }

    return {
      category: concernKey,
      onset_date: onsetDate(),
      severity: answers.severity?.value ?? 'unsure',
      answers: followUps,
      details: notes.trim() ? notes.trim() : null,
    }
  }

  async function send() {
    setSending(true)
    setSendError('')
    try {
      const message = await onSend(buildPayload())
      setNextStep(message || '')
      setStage('sent')
    } catch (failure: any) {
      setSendError(failure?.message || 'We could not send your report. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function restart() {
    setIndex(0)
    setConcern(null)
    setAnswers({})
    setNotes('')
    setPickedDate('')
    setDateDraft('')
    setShowDatePicker(false)
    setStage('chat')
    setSendError('')
    setNextStep('')
  }

  const todayIso = isoDate(new Date())

  return (
    <div className="resident-content">
      <div className="schat-page">
        <div className="resident-page-header schat-page-header">
          <h1>Report symptoms</h1>
          <p>Answer a few simple questions. Typing is never required.</p>
          <p className="schat-disclaimer">{QUESTIONNAIRE_NOTE}</p>
        </div>

        <div className="schat-card">
          <header className="schat-card-head">
            <span className="schat-avatar" aria-hidden="true"><PlusIcon /></span>
            <div className="schat-card-head-text">
              <strong>Health assistant</strong>
              <span>Barangay health center</span>
            </div>
            {stage === 'chat' ? (
              <span className="schat-step-pill" role="status" aria-live="polite">
                Step {Math.min(index + 1, steps.length)} of {steps.length}
              </span>
            ) : (
              <span className="schat-step-pill">{stage === 'review' ? 'Review' : 'Sent'}</span>
            )}
          </header>

          <div className="schat-log" role="log" aria-live="polite" aria-label="Conversation with the health assistant">
            <AssistantBubble>
              <p>Hi {firstName}. I am here to help you tell the health team how you are feeling.</p>
              <p className="schat-bubble-note">We will go one question at a time.</p>
            </AssistantBubble>

            {steps.slice(0, index).map(step => {
              const answer = answers[step.id]
              if (!answer) return null
              return (
                <Fragment key={step.id}>
                  <AssistantBubble>{step.question}</AssistantBubble>
                  <ResidentBubble>{answer.label}</ResidentBubble>
                  {urgentAfter(step.id, answer.value) && <UrgentCard />}
                </Fragment>
              )
            })}

            {stage === 'chat' && currentStep && (
              typing ? (
                <TypingBubble />
              ) : (
                <AssistantBubble>
                  <p>{currentStep.question}</p>
                  {currentStep.helper && <p className="schat-bubble-note">{currentStep.helper}</p>}
                </AssistantBubble>
              )
            )}

            {stage === 'review' && (
              <section ref={focusRef} className="schat-summary" aria-labelledby="schat-summary-title">
                <h2 id="schat-summary-title">Please check your answers</h2>
                <p className="schat-summary-lede">Tap Edit beside anything you want to change.</p>

                <dl className="schat-summary-list">
                  {steps.map((step, stepIndex) => (
                    <div className="schat-summary-row" key={step.id}>
                      <dt>{step.question}</dt>
                      <dd>
                        <span>{answers[step.id]?.label || '—'}</span>
                        <button type="button" className="schat-edit" onClick={() => editStep(stepIndex)}>
                          Edit
                        </button>
                      </dd>
                    </div>
                  ))}
                </dl>

                {urgent && <UrgentCard />}

                {sendError && <p className="notice error" role="alert">{sendError}</p>}

                <div className="schat-summary-actions">
                  <button type="button" className="button" onClick={send} disabled={sending}>
                    {sending ? 'Sending…' : 'Send report'}
                  </button>
                  <button type="button" className="button secondary" onClick={() => editStep(0)} disabled={sending}>
                    Edit answers
                  </button>
                </div>
              </section>
            )}

            {stage === 'sent' && (
              <section ref={focusRef} className="schat-done" aria-labelledby="schat-done-title">
                <span className="schat-done-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                    <path d="m5 12 5 5 9-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h2 id="schat-done-title">Your report was sent</h2>
                <p>The barangay health team will review it. They may contact you to schedule a checkup.</p>

                {urgent && <UrgentCard />}

                <h3>{recommendation.title}</h3>
                <ul className="schat-advice">
                  {recommendation.tips.map(item => <li key={item}>{item}</li>)}
                </ul>

                {!urgent && (
                  <p className="schat-help-note">
                    <strong>Get help right away if</strong> {recommendation.seekHelp}
                  </p>
                )}

                <p className="schat-guidance-note">This is general guidance, not a diagnosis.</p>

                {nextStep && <p className="schat-next-step">{nextStep}</p>}

                <button type="button" className="button" onClick={restart}>Start a new report</button>
              </section>
            )}

            <div ref={endRef} />
          </div>

          {stage === 'chat' && currentStep && (
            <footer className="schat-composer">
              <div className="schat-progress">
                <span className="schat-progress-track" aria-hidden="true">
                  <span className="schat-progress-fill" style={{ width: `${progress}%` }} />
                </span>
                {index > 0 && (
                  <button type="button" className="schat-back" onClick={goBack}>
                    ← Back
                  </button>
                )}
              </div>

              {!typing && (
                <>
                  {currentStep.kind === 'chips' && currentStep.chips && (
                    showDatePicker ? (
                      <div className="schat-date">
                        <label htmlFor="schat-start-date">Pick the day it started</label>
                        <input
                          id="schat-start-date"
                          type="date"
                          max={todayIso}
                          value={dateDraft}
                          onChange={event => setDateDraft(event.target.value)}
                        />
                        <div className="schat-inline-actions">
                          <button
                            type="button"
                            className="schat-chip is-quiet"
                            onClick={() => { setShowDatePicker(false); setDateDraft('') }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="schat-primary"
                            disabled={!dateDraft}
                            onClick={usePickedDate}
                          >
                            Use this date
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="schat-chips">
                        {currentStep.chips.map(chip => {
                          const selected = answers[currentStep.id]?.value === chip.value
                          return (
                            <button
                              key={chip.value}
                              type="button"
                              className={`schat-chip${chip.tone === 'urgent' ? ' is-urgent' : ''}${selected ? ' is-selected' : ''}`}
                              aria-pressed={selected}
                              onClick={() => choose(currentStep, chip)}
                            >
                              <span className="schat-chip-label">{chip.label}</span>
                              {chip.hint && <span className="schat-chip-hint">{chip.hint}</span>}
                            </button>
                          )
                        })}
                      </div>
                    )
                  )}

                  {currentStep.kind === 'notes' && (
                    <div className="schat-notes">
                      <label className="visually-hidden" htmlFor="schat-notes">
                        Anything else the health worker should know?
                      </label>
                      <textarea
                        id="schat-notes"
                        rows={3}
                        maxLength={3000}
                        placeholder="You can type here, or skip this step."
                        value={notes}
                        onChange={event => setNotes(event.target.value)}
                      />
                      <div className="schat-inline-actions">
                        <button type="button" className="schat-chip is-quiet" onClick={() => continueWithNotes('Skipped')}>
                          Skip
                        </button>
                        <button type="button" className="schat-primary" onClick={() => continueWithNotes(notes.trim() || 'Skipped')}>
                          Continue
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </footer>
          )}
        </div>

        <p className="schat-foot-note">
          If this is an emergency, go to the health center or call local emergency services right away.
        </p>
      </div>
    </div>
  )
}
