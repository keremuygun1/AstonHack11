import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

function SignUp({ embedded = false, onSwitchToSignIn }) {
  const [profilePreview, setProfilePreview] = useState("");
  const uploadInputRef = useRef(null);

  const { loginWithRedirect } = useAuth0();

  useEffect(() => {
    return () => {
      if (profilePreview) URL.revokeObjectURL(profilePreview);
    };
  }, [profilePreview]);

  const handlePhotoChange = (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    if (profilePreview) URL.revokeObjectURL(profilePreview);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    await loginWithRedirect({
      authorizationParams: { screen_hint: "signup" },
    });
  };

  const handleGoToSignIn = async () => {
    // You can either redirect to Auth0 login...
    await loginWithRedirect();
    // ...or if you prefer, navigate to /signin (your existing route)
  };

  const content = (
    <section className="form-card form-card--tall">
      <h1 className="headline">Create account</h1>
      <p className="subhead">Join to keep track of lost and found items.</p>

      <form className="form" autoComplete="on" onSubmit={handleSignUp}>
        <label className="field">
          <span>Username</span>
          <input type="text" name="username" placeholder="Create username" disabled />
        </label>
        <label className="field">
          <span>First name</span>
          <input type="text" name="firstName" placeholder="Name" disabled />
        </label>
        <label className="field">
          <span>Last name</span>
          <input type="text" name="lastName" placeholder="Last name" disabled />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" placeholder="Email" disabled />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" name="password" placeholder="Create password" disabled />
        </label>

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
              onChange={handlePhotoChange}
            />
          </div>
        </label>

        {profilePreview && (
          <div className="preview-grid" aria-live="polite">
            <div className="preview">
              <img src={profilePreview} alt="Selected profile" />
            </div>
          </div>
        )}

        <button className="btn btn-primary" type="submit">
          Create account
        </button>

        {embedded && onSwitchToSignIn ? (
          <button className="btn btn-secondary" type="button" onClick={onSwitchToSignIn}>
            Already have an account? Sign in
          </button>
        ) : (
          <button className="btn btn-secondary" type="button" onClick={handleGoToSignIn}>
            Already have an account? Sign in
          </button>
        )}
      </form>
    </section>
  );

  if (embedded) return content;

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
      {content}
    </main>
  );
}

export default SignUp;
