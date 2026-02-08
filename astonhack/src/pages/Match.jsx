import { Link } from 'react-router-dom'

function Match() {
  return (
    <main className="page">
      <div className="modal-overlay">
        <div className="modal-card" role="dialog" aria-modal="true">
          <Link className="modal-close" to="/" aria-label="Close">
            <span aria-hidden="true">×</span>
          </Link>
          <div className="modal-content">
            <section className="form-card">
              <h1 className="headline">We found a match!</h1>
              <p className="subhead">
                A lost item appears to match a recently found item. Review the details and get in touch.
              </p>
              <div className="match-grid">
                <div className="match-card">
                  <p className="match-label">Lost item</p>
                  <h2 className="match-title">Black wallet</h2>
                  <p className="match-subtitle">University of Birmingham</p>
                </div>
                <div className="match-card">
                  <p className="match-label">Found item</p>
                  <h2 className="match-title">Leather wallet</h2>
                  <p className="match-subtitle">Bullring</p>
                </div>
              </div>
              <div className="match-actions">
                <Link className="btn btn-secondary" to="/profile">
                  View profile
                </Link>
                <Link className="btn btn-primary" to="/maps/map.html">
                  View map
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Match