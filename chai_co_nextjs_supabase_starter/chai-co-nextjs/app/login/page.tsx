import { signIn } from "./actions";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const messages: Record<string, string> = {
    missing: "Enter your email and password.",
    invalid: "Email or password is incorrect.",
    inactive: "This account is inactive. Contact the Chai & Co. Admin.",
  };

  return (
    <main className="login-shell">
      <section className="login-story" aria-label="Chai & Co.">
        <div className="login-story-top">
          <div className="brand-mark login-brand-mark">C<span>&amp;</span></div>
          <div>
            <div className="login-brand-name">Chai &amp; Co.</div>
            <div className="login-brand-caption">BREWING BETTER DAYS</div>
          </div>
        </div>

        <div className="login-story-copy">
          <span className="login-kicker"><span /> YOUR DAILY BREW, BETTER ORGANISED</span>
          <h1>Your shop.<br />Your team.<br /><em>Your day.</em></h1>
          <p>Everything that keeps Chai &amp; Co. running smoothly, all in one place.</p>
          <div className="login-feature-list">
            <div><span className="login-feature-icon">↗</span><span><strong>Know your numbers</strong><small>Sales and expenses, at a glance.</small></span></div>
            <div><span className="login-feature-icon">◫</span><span><strong>Stay stocked</strong><small>Keep inventory and purchases in check.</small></span></div>
            <div><span className="login-feature-icon">◌</span><span><strong>Keep every recipe consistent</strong><small>Manage ingredients and recipe costs.</small></span></div>
          </div>
        </div>
        <div className="login-story-footer"><span>MADE FOR THE PEOPLE BEHIND THE COUNTER</span><span>EST. WITH CARE · CHAI &amp; CO.</span></div>
        <div className="login-deco login-deco-one" aria-hidden="true" />
        <div className="login-deco login-deco-two" aria-hidden="true" />
      </section>

      <section className="login-panel">
        <div className="login-mobile-brand">
          <div className="brand-mark">C<span>&amp;</span></div>
          <div><div className="login-brand-name">Chai &amp; Co.</div><div className="login-brand-caption">BREWING BETTER DAYS</div></div>
        </div>
        <div className="login-form-wrap">
          <div className="login-welcome-label">YOUR WORKSPACE AWAITS</div>
          <h2>Welcome back<span>.</span></h2>
          <p className="login-intro">Sign in to pick up where you left off.</p>

          {error && messages[error] && <div className="notice error login-error" role="alert">{messages[error]}</div>}

          <form action={signIn} className="login-form login-form-polished">
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" placeholder="you@chaiandco.com" autoComplete="username" autoCapitalize="none" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" placeholder="Enter your password" autoComplete="current-password" required />
            </div>
            <button className="btn primary login-submit" type="submit"><span>Sign in to your workspace</span><span aria-hidden="true">→</span></button>
          </form>

          <div className="login-secure-note"><span aria-hidden="true">⌑</span> Secure access for authorised team members</div>
          <div className="login-help"><span>Need access?</span> Contact your Chai &amp; Co. shop Admin.</div>
        </div>
        <footer className="login-panel-footer">© {new Date().getFullYear()} Chai &amp; Co. <span>Made with care, served with chai.</span></footer>
      </section>
    </main>
  );
}
