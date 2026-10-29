/**
 * Opening splash: the MediTrack wordmark is drawn stroke-first, then settles
 * into its solid form. Pure CSS timeline — no JS driving the animation.
 *
 * Timings: draw .2s–1.7s, settle 1.7s–2.25s, hold, fade out 2.5s–3.1s.
 * The parent unmounts this at 3.2s.
 */
function SplashIntro() {
  return (
    <div className="splash" aria-hidden="true">
      <div className="splash-word">
        <div className="splash-draw">
          <svg viewBox="0 0 560 130">
            <text x="280" y="92" textAnchor="middle">MediTrack</text>
          </svg>
        </div>
        <div className="splash-settle">
          <svg viewBox="0 0 560 130">
            <text x="280" y="92" textAnchor="middle">MediTrack</text>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default SplashIntro