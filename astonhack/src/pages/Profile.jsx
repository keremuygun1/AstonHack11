import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const uploadInputRef = useRef(null);

  const { user, isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsEditing(false);
      setIsClosing(false);
    }, 220);
  };

  if (isLoading) {
    return <div className="page">Loading...</div>;
  }

  // If you want: block profile page when not logged in
  if (!isAuthenticated) {
    return (
      <main className="page">
        <header className="topbar">
          <Link className="topbar-left" to="/">
            <span className="brand-dot" aria-hidden="true" />
            <span className="brand-name">Lost and Found</span>
          </Link>
          <Link className="btn btn-ghost" to="/">Home</Link>
        </header>

        <section className="form-card">
          <h1 className="headline">You’re not signed in</h1>
          <p className="subhead">Log in to view your profile.</p>
          <button className="btn btn-primary" onClick={() => loginWithRedirect()}>
            Log in
          </button>
        </section>
      </main>
    );
  }

  // Helpers
  const displayName = user?.name || user?.nickname || user?.email || "User";
  const displayUsername = user?.nickname || user?.email?.split("@")[0] || "user";
  const displayEmail = user?.email || "—";

  return (
    <main className="page profile-page">
      <header className="topbar">
        <Link className="topbar-left" to="/">
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-name">Lost and Found</span>
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn btn-ghost" to="/">Home</Link>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          >
            Log out
          </button>
        </div>
      </header>

      <section className="profile-card">
        <button
          className="btn btn-secondary profile-edit"
          type="button"
          onClick={() => setIsEditing(true)}
        >
          Edit profile
        </button>

const { logout } = useAuth0();

<button
  className="btn btn-ghost"
  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
>
  Log out
</button>
        <div className="profile-photo">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={displayName}
              style={{ width: "100%", height: "100%", borderRadius: "inherit", objectFit: "cover" }}
            />
          ) : (
            <span aria-hidden="true">{displayName.slice(0, 2).toUpperCase()}</span>
          )}
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

      {/* everything else stays the same... */}
    </main>
  );
}

export default Profile;
