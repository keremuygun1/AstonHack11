import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

function SignIn({ embedded = false, onSwitchToSignUp }) {
  const { loginWithRedirect } = useAuth0();

  const handleSignIn = async (e) => {
    e.preventDefault();
    await loginWithRedirect();
  };

  const handleSignUp = async () => {
    await loginWithRedirect({
      authorizationParams: { screen_hint: "signup" },
    });
  };

  const content = (
    <section className="form-card">
      <h1 className="headline">Welcome back</h1>
      <p className="subhead">Sign in to keep track of your items.</p>

      {/* Auth0 handles the real login UI, so we just redirect */}
      <form className="form" autoComplete="on" onSubmit={handleSignIn}>
        <label className="field">
          <span>Username</span>
          <input type="text" name="username" placeholder="Username" disabled />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" name="password" placeholder="Password" disabled />
        </label>

        <button className="btn btn-primary" type="submit">
          Sign in
        </button>

        {embedded ? (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onSwitchToSignUp}
          >
            Don't have an account? Sign up
          </button>
        ) : (
          <button className="btn btn-secondary" type="button" onClick={handleSignUp}>
            Don't have an account? Sign up
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

export default SignIn;