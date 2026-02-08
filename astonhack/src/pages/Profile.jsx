import { useRef, useState } from "react";
import { Link } from "react-router-dom";

function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const uploadInputRef = useRef(null);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsEditing(false);
      setIsClosing(false);
    }, 220);
  };

  const displayName = "Alex Brown";
  const displayUsername = "alexbrown";
  const displayEmail = "alex@astonhack.com";

  return (
    <main className="page profile-page">
      <header className="topbar">
        <Link className="topbar-left" to="/">
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-name">Lost and Found</span>
        </Link>
        <Link className="btn btn-ghost" to="/">Home</Link>
      </header>

      <section className="profile-card">
        <button
          className="btn btn-secondary profile-edit"
          type="button"
          onClick={() => setIsEditing(true)}
        >
          Edit profile
        </button>
        <div className="profile-photo">
          <span aria-hidden="true">{displayName.slice(0, 2).toUpperCase()}</span>
        </div>

        <div className="profile-info">
          <h1 className="headline">{displayName}</h1>
          <div className="profile-meta">
            <div>
              <span className="profile-label">Username</span>
              <span className="profile-value">{displayUsername}</span>
            </div>
            <div>
              <span className="profile-label">Email</span>
              <span className="profile-value">{displayEmail}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-previews">
        <div className="profile-panel">
          <div className="profile-panel-header">
            <h2>Lost items</h2>
            <span className="panel-count">2</span>
          </div>
          <div className="panel-list">
            <div className="panel-item">
              <div className="panel-thumb" />
              <div>
                <p className="panel-title">Black wallet</p>
                <p className="panel-subtitle">University of Birmingham</p>
                <p className="panel-meta">Reported Feb 2, 2026</p>
              </div>
              <button className="panel-delete" type="button" aria-label="Delete report">
                Delete
              </button>
            </div>
            <div className="panel-item">
              <div className="panel-thumb" />
              <div>
                <p className="panel-title">iPhone 13</p>
                <p className="panel-subtitle">Bullring</p>
                <p className="panel-meta">Reported Jan 28, 2026</p>
              </div>
              <button className="panel-delete" type="button" aria-label="Delete report">
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="profile-panel">
          <div className="profile-panel-header">
            <h2>Found items</h2>
            <span className="panel-count">1</span>
          </div>
          <div className="panel-list">
            <div className="panel-item">
              <div className="panel-thumb" />
              <div>
                <p className="panel-title">Blue backpack</p>
                <p className="panel-subtitle">Aston University</p>
                <p className="panel-meta">Reported Feb 5, 2026</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isEditing && (
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
            <button className="modal-close" type="button" onClick={closeModal} aria-label="Close">
              <span aria-hidden="true">×</span>
            </button>
            <div className="modal-content">
              <section className="form-card">
                <h1 className="headline">Edit profile</h1>
                <p className="subhead">Update your profile details.</p>
                <form className="form" autoComplete="on">
                  <label className="field">
                    <span>Profile picture</span>
                    <div className="photo-actions">
                      <button
                        className="btn btn-secondary btn-camera"
                        type="button"
                        onClick={() => uploadInputRef.current?.click()}
                      >
                        Upload photo
                      </button>
                      <input
                        ref={uploadInputRef}
                        className="file-input file-input--hidden"
                        type="file"
                        accept="image/*"
                      />
                    </div>
                  </label>
                  <label className="field">
                    <span>Username</span>
                    <input type="text" name="username" placeholder="Change username" />
                  </label>
                  <label className="field">
                    <span>Name</span>
                    <input type="text" name="name" placeholder="Change name" />
                  </label>
                  <label className="field">
                    <span>Password</span>
                    <input type="password" name="password" placeholder="Change password" />
                  </label>
                  <button className="btn btn-primary" type="submit">
                    Save changes
                  </button>
                </form>
              </section>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default Profile;