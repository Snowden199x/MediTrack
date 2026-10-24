import '../resident.css'

interface Category {
  label: string
  questions: Array<{ key: string; label: string; type: string; options: string[] }>
}

interface ReportState {
  category: string
  onset_date: string
  severity: string
  details: string
  answers: Record<string, string>
}

interface Props {
  categories: Record<string, Category>
  report: ReportState
  nextStep: string
  onReportChange: (r: ReportState) => void
  onSubmit: (event: React.FormEvent) => void
}

export default function ReportSymptomsPage({ categories, report, nextStep, onReportChange, onSubmit }: Props) {
  const questions = categories[report.category]?.questions ?? []

  return (
    <div className="resident-content">
      <div className="resident-page-header">
        <h1>Report symptoms</h1>
        <p>Describe what you are feeling so the health team can review it.</p>
      </div>

      <div className="form-page">
        <h2>Describe what you are feeling</h2>
        <p>These questions help the health team understand your concern. They do not identify a disease.</p>

        <form className="form-stack" onSubmit={onSubmit}>
          <label>
            Main concern
            <select
              required
              value={report.category}
              onChange={e => onReportChange({ ...report, category: e.target.value, answers: {} })}
            >
              <option value="">Choose one</option>
              {Object.entries(categories).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <label>
              When did it start? <span className="optional">Optional</span>
              <input
                type="date"
                value={report.onset_date}
                onChange={e => onReportChange({ ...report, onset_date: e.target.value })}
              />
            </label>
            <label>
              How does it feel to you?
              <select
                value={report.severity}
                onChange={e => onReportChange({ ...report, severity: e.target.value })}
              >
                <option value="unsure">Not sure</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </label>
          </div>

          {questions.map((question, index) => (
            <label key={question.key}>
              {question.label}
              {question.type === 'choice' ? (
                <select
                  required={index === 0}
                  value={report.answers[question.key] ?? ''}
                  onChange={e => onReportChange({ ...report, answers: { ...report.answers, [question.key]: e.target.value } })}
                >
                  <option value="">Choose one</option>
                  {question.options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  required={index === 0}
                  maxLength={500}
                  value={report.answers[question.key] ?? ''}
                  onChange={e => onReportChange({ ...report, answers: { ...report.answers, [question.key]: e.target.value } })}
                />
              )}
            </label>
          ))}

          <label>
            Anything else the health worker should know? <span className="optional">Optional</span>
            <textarea
              rows={4}
              maxLength={3000}
              value={report.details}
              onChange={e => onReportChange({ ...report, details: e.target.value })}
            />
          </label>

          <button className="button">Send report</button>
        </form>

        {nextStep && (
          <div className="next-step">
            <h3>Next step</h3>
            <p>{nextStep}</p>
          </div>
        )}
      </div>
    </div>
  )
}
