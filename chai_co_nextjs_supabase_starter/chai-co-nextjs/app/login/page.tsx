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
      <section className="login-card">
        <div className="brand">
          <div className="brand-mark">C<span style={{fontSize: 11}}>&amp;</span></div>
          <div><h1>Chai &amp; Co.</h1><p>Shop management</p></div>
        </div>
        <h2>Welcome back</h2>
        <p>Sign in to manage your shop operations.</p>
        {error && messages[error] && <div className="notice error" role="alert">{messages[error]}</div>}
        <form action={signIn} className="login-form">
          <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="username" required /></div>
          <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
          <button className="btn primary" type="submit">Sign in</button>
        </form>
        <p className="footnote">Accounts are provisioned by the shop Admin. Public sign-up is intentionally not provided in this starter.</p>
      </section>
    </main>
  );
}
