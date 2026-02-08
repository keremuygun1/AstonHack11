import { useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import heroIllustration from '../Octopus.png'
import FoundItem from './pages/FoundItem.jsx'
import LostItem from './pages/LostItem.jsx'
import SignIn from './pages/SignIn.jsx'
import SignUp from './pages/SignUp.jsx'
import MapPage from './pages/MapPage.jsx'
import Profile from './pages/Profile.jsx'
import Match from './pages/Match.jsx'
import { useAuth0 } from "@auth0/auth0-react";
// Profile should be accessible without Auth0 redirect


function App() {
  const { loginWithRedirect, isAuthenticated, logout } = useAuth0();
  const location = useLocation();
  const [activeModal, setActiveModal] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const [authRedirected, setAuthRedirected] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('code') && params.get('state')) {
      setAuthRedirected(true)
      localStorage.setItem('auth0_redirected', 'true')
    }
  }, [location.search])

  useEffect(() => {
    if (!authRedirected) {
      const stored = localStorage.getItem('auth0_redirected')
      if (stored === 'true') {
        setAuthRedirected(true)
      }
    }
  }, [authRedirected])

  const shouldShowAuth = useMemo(
    () => ({
      showLogout: isAuthenticated || authRedirected,
      showSignIn: !(isAuthenticated || authRedirected),
    }),
    [isAuthenticated, authRedirected]
  )
  const canReport = shouldShowAuth.showLogout

  const closeModal = () => {
    setIsClosing(true)
    setTimeout(() => {
      setActiveModal(null)
      setIsClosing(false)
    }, 220)
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <main className="page landing">
            <div
              className="landing-hero-art"
              style={{ backgroundImage: `url(${heroIllustration})` }}
              aria-hidden="true"
            />
            <div className="bubbles" aria-hidden="true">
              <span className="bubble bubble-sm bubble-1" />
              <span className="bubble bubble-md bubble-2" />
              <span className="bubble bubble-lg bubble-3" />
              <span className="bubble bubble-sm bubble-4" />
              <span className="bubble bubble-md bubble-5" />
              <span className="bubble bubble-sm bubble-6" />
              <span className="bubble bubble-lg bubble-7" />
              <span className="bubble bubble-md bubble-8" />
              <span className="bubble bubble-sm bubble-9" />
              <span className="bubble bubble-md bubble-10" />
            </div>
            <header className="topbar">
              <Link className="topbar-left" to="/">
                <span className="brand-dot" aria-hidden="true" />
                <span className="brand-name">Lost and Found</span>
              </Link>
              {shouldShowAuth.showLogout && (
                <div className="topbar-actions">
                  <Link className="btn btn-ghost" to="/profile">
                    Profile
                  </Link>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('auth0_redirected')
                      setAuthRedirected(false)
                      logout({ logoutParams: { returnTo: window.location.origin } })
                    }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </header>
            <section className="hero">
              <div className="hero-text">
                <h1 className="headline">Lost Something?</h1>
                <p className="subhead">
                  We help reunite people with their belongings quickly and safely.
                </p>
              </div>
              {shouldShowAuth.showSignIn && (
                <button
                  className="btn landing-signin"
                  type="button"
                  onClick={() => loginWithRedirect()}
                >
                  Sign in to report an item
                </button>
              )}
            </section>
            <div className="actions actions-bottom">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => canReport && setActiveModal('found')}
                disabled={!canReport}
              >
                <i className="fa-solid fa-box-open btn-icon" aria-hidden="true" />
                I found an item
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => canReport && setActiveModal('lost')}
                disabled={!canReport}
              >
                <i className="fa-solid fa-magnifying-glass btn-icon" aria-hidden="true" />
                I lost an item
              </button>
              <a className="btn btn-secondary" href="/maps/map.html">
                <i className="fa-solid fa-map-location-dot btn-icon" aria-hidden="true" />
                View map
              </a>
            </div>
            {activeModal && (
              <div
                className={`modal-overlay${isClosing ? ' modal-overlay--closing' : ''}`}
                role="presentation"
                onClick={closeModal}
              >
                <div
                  className={`modal-card${isClosing ? ' modal-card--closing' : ''}`}
                  role="dialog"
                  aria-modal="true"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    className="modal-close"
                    type="button"
                    onClick={closeModal}
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                  <div className="modal-content">
                    {activeModal === 'found' && <FoundItem embedded />}
                    {activeModal === 'lost' && <LostItem embedded />}
                    {activeModal === 'signin' && (
                      <SignIn embedded onSwitchToSignUp={() => setActiveModal('signup')} />
                    )}
                    {activeModal === 'signup' && (
                      <SignUp embedded onSwitchToSignIn={() => setActiveModal('signin')} />
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        }
      />
  <Route path="/found" element={<FoundItem />} />
<Route path="/lost" element={<LostItem />} />
<Route path="/profile" element={<Profile />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/match" element={<Match />} />
    </Routes>
  )
}

export default App