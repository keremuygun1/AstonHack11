import { Link, useLocation } from "react-router-dom";

function Match() {
  const { state } = useLocation();
  const verdict = state?.verdict;
  const sourceItemId = state?.sourceItemId;

  // If someone visits /match directly (no state)
  if (!verdict) {
    return (
      <main className="page">
        <div className="modal-overlay">
          <div className="modal-card" role="dialog" aria-modal="true">
            <Link className="modal-close" to="/" aria-label="Close">
              <span aria-hidden="true">×</span>
            </Link>
            <div className="modal-content">
              <section className="form-card">
                <h1 className="headline">No match data</h1>
                <p className="subhead">
                  This page needs a verdict from the matching request.
                </p>
                <Link className="btn btn-primary" to="/">
                  Go back
                </Link>
              </section>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const top = verdict.candidates?.[0];

  return (
    <main className="page">
      <div className="modal-overlay">
        <div className="modal-card" role="dialog" aria-modal="true">
          <Link className="modal-close" to="/" aria-label="Close">
            <span aria-hidden="true">×</span>
          </Link>

          <div className="modal-content">
            <section className="form-card">
              <h1 className="headline">
                {verdict.decision === "match" ? "We found a match!" : "No confirmed match"}
              </h1>

              <p className="subhead">
                Decision: <b>{verdict.decision}</b> • Confidence: <b>{verdict.confidence}</b>
              </p>

              {top && (
                <div className="match-grid">
                  <div className="match-card">
                    <p className="match-label">Submitted item</p>
                    <h2 className="match-title">{sourceItemId}</h2>
                    <p className="match-subtitle">Your report</p>
                  </div>

                  <div className="match-card">
                    <p className="match-label">Top candidate</p>
                    <h2 className="match-title">{top.text || top.image_names || "Candidate"}</h2>
                    <p className="match-subtitle">CLIP: {top.clip_score}</p>
                  </div>
                </div>
              )}

              {Array.isArray(verdict.reasons) && verdict.reasons.length > 0 && (
                <>
                  <h3 style={{ marginTop: 16 }}>Why</h3>
                  <ul>
                    {verdict.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </>
              )}

              <div className="match-actions">
                <Link className="btn btn-secondary" to="/profile">
                  View profile
                </Link>
                <Link className="btn btn-primary" to="/map">
                  View map
                </Link>
              </div>

              <details style={{ marginTop: 16 }}>
                <summary>Debug JSON</summary>
                <pre style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(verdict, null, 2)}
                </pre>
              </details>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Match;
