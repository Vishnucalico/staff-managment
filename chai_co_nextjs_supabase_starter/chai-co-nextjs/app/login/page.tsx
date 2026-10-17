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
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="login-wordmark">Chai &amp; Co.</div>
          <div className="login-tagline">Brewing better days</div>
        </div>
        <h1 id="login-title">Welcome back</h1>
        <p className="login-subtitle">Sign in to your team workspace.</p>
        {error && messages[error] && <div className="login-error" role="alert">{messages[error]}</div>}
        <LoginForm action={signIn} />
        <p className="login-secure"><span aria-hidden="true">●</span> Secure access for authorised team members</p>
      </section>
    </main>
  );
}
