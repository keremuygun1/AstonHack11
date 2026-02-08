import { Link } from 'react-router-dom'

function MapPage() {
  return (
    <main className="page">
      <header className="topbar">
        <Link className="topbar-left" to="/">
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-name">Lost and Found</span>
        </Link>
        <Link className="btn btn-ghost" to="/">
          Home
        </Link>
      </header>
    </main>
  )
}

export default MapPage