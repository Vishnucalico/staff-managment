"use client";

import { useState } from "react";

type Props = { action: (formData: FormData) => void | Promise<void> };

export default function LoginForm({ action }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [help, setHelp] = useState("");
  return (
    <form action={action} className="login-form">
      <label className="login-input">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>
        <input id="email" name="email" type="email" placeholder="Email address" autoComplete="username" required aria-label="Email address" />
      </label>
      <label className="login-input">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>
        <input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Password" autoComplete="current-password" required aria-label="Password" />
        <button className="login-eye" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>
        </button>
      </label>
      <div className="login-meta">
        <label className="login-remember"><input type="checkbox" name="remember" /> Remember me</label>
        <button className="login-help" type="button" onClick={() => setHelp("For a password reset, contact your Chai & Co. Admin.")}>Forgot password?</button>
      </div>
      {help && <p className="login-help-message" role="status">{help}</p>}
      <button className="login-submit" type="submit">Sign in <span aria-hidden="true">→</span></button>
    </form>
  );
}
