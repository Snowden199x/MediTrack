/**
 * Stub — "Register an account" nav item.
 * This section is visible to guests on the landing page. When a logged-in
 * resident navigates here it shows a short explanation and a link back home.
 */

interface Props {
  onHome: () => void
}

export default function RegisterAccountPage({ onHome }: Props) {
  return (
    <div className="resident-content">
      <div className="resident-page-header">
        <h1>Register an account</h1>
        <p>You already have a resident account.</p>
      </div>

      <div className="panel" style={{ maxWidth: 560 }}>
        <h2>Already registered</h2>
        <p>
          You are currently logged in as a resident. New accounts can be created from the
          MediTrack home page by visitors who do not have an account yet.
        </p>
        <button className="button secondary" onClick={onHome}>Back to Home</button>
      </div>
    </div>
  )
}
