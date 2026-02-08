import { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import './App.css'
import heroIllustration from '../Octopus.png'
import FoundItem from './pages/FoundItem.jsx'
import LostItem from './pages/LostItem.jsx'
import SignIn from './pages/SignIn.jsx'
import SignUp from './pages/SignUp.jsx'
import MapPage from './pages/MapPage.jsx'
import Profile from './pages/Profile.jsx'
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";

const ProtectedFoundItem = withAuthenticationRequired(FoundItem);
const ProtectedLostItem = withAuthenticationRequired(LostItem);
const ProtectedProfile = withAuthenticationRequired(Profile);


function App() {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const [activeModal, setActiveModal] = useState(null)
  const [isClosing, setIsClosing] = useState(false)

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
            </header>
            <section className="hero">
              <div className="hero-text">
                <h1 className="headline">Lost Something?</h1>
                <p className="subhead">
                  We help reunite people with their belongings quickly and safely.
                </p>
              </div>
              <button
  className="btn landing-signin"
  type="button"
  onClick={() => loginWithRedirect()}
>
  Sign in to report an item
</button>
            </section>
            <div className="actions actions-bottom">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setActiveModal('found')}
              >
                <i className="fa-solid fa-box-open btn-icon" aria-hidden="true" />
                I found an item
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setActiveModal('lost')}
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
   <Route path="/found" element={<ProtectedFoundItem />} />
<Route path="/lost" element={<ProtectedLostItem />} />
<Route path="/profile" element={<ProtectedProfile />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/map" element={<MapPage />} />
    </Routes>
  )
}

export default App