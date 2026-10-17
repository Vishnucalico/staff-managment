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
    <main className="login-wrap">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="login-wordmark">Chai &amp; Co.</div>
          <div className="login-tagline">Brewing better days</div>
        </div>
        <h1 id="login-title">Welcome back</h1>
        <p className="login-subtitle">Sign in to your team workspace.</p>
        {error && messages[error] && <div className="login-error" role="alert">{messages[error]}</div>}
        <form action={signIn} className="login-form">
          <label className="login-input">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>
            <input id="email" name="email" type="email" placeholder="Email address" autoComplete="username" required aria-label="Email address" />
          </label>
          <label className="login-input">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>
            <input id="password" name="password" type="password" placeholder="Password" autoComplete="current-password" required aria-label="Password" />
          </label>
          <div className="login-meta">
            <label className="login-remember"><input type="checkbox" name="remember" /> Remember me</label>
            <span className="login-help">Need help? Contact your Admin</span>
          </div>
          <button className="login-submit" type="submit">Sign in <span aria-hidden="true">→</span></button>
        </form>
        <p className="login-secure"><span aria-hidden="true">●</span> Secure access for authorised team members</p>
      </section>
    </main>
  );
}
