import { signIn } from "./actions";
import LoginForm from "./login-form";

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
      <section className="login-hero" aria-label="Chai & Co.">
        <div className="hero-brand">
          <div className="hero-mark" aria-hidden="true">C&amp;</div>
          <div>
            <div className="hero-wordmark">Chai &amp; Co.</div>
            <div className="hero-tagline">Brewing better days</div>
          </div>
        </div>
        <p className="hero-kicker">BREWING BETTER DAYS</p>
        <h1 className="hero-headline">Good <em>Food</em><br />Better<br />Days</h1>
        <div className="hero-rule" />
        <p className="hero-copy">Manage your team, menu, inventory and daily operations in one place.</p>
        <div className="hero-features">
          <div><span aria-hidden="true">♙</span><small>Staff<br />Management</small></div>
          <div><span aria-hidden="true">⬡</span><small>Inventory<br />Control</small></div>
          <div><span aria-hidden="true">▤</span><small>Recipe<br />Costing</small></div>
          <div><span aria-hidden="true">▥</span><small>Sales<br />Insights</small></div>
        </div>
      </section>
      <section className="login-card" aria-labelledby="login-title">
        <h2 id="login-title">Welcome back</h2>
        <p className="login-subtitle">Sign in to your team workspace.</p>
        {error && messages[error] && <div className="login-error" role="alert">{messages[error]}</div>}
        <LoginForm action={signIn} />
        <p className="login-secure"><span aria-hidden="true">●</span> Secure access for authorised team members</p>
      </section>
    </main>
  );
}
