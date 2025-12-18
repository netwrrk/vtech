"use client";

export default function SignInPage() {
  return (
    <main className="signin-root">
      <div className="signin-card">
        <header className="signin-header">
          <h1>VTech</h1>
          <p>Sign in to Tech Console</p>
        </header>

        <form className="signin-form">
          <label>
            <span>Email</span>
            <input
              type="email"
              placeholder="you@vtech.ai"
              autoComplete="email"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          <button type="button" className="primary-btn">
            Sign In
          </button>
        </form>

        <footer className="signin-footer">
          <span>Tech access only</span>
        </footer>
      </div>
    </main>
  );
}
