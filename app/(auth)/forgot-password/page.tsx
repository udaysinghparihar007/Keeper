"use client";

import Link from "next/link";
import HighlightOutlinedIcon from "@mui/icons-material/HighlightOutlined";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <Link href="/" className="brand-link auth-brand">
          <span className="brand-mark">
            <HighlightOutlinedIcon fontSize="small" />
          </span>
          Keeper
        </Link>
        <section className="auth-card">
          <p className="eyebrow">Account access</p>
          <h1>No password to reset.</h1>
          <p>
            Keeper currently uses Google and GitHub sign-in, so your account
            password is managed by the provider you chose.
          </p>
          <div className="auth-actions">
            <Link href="/login" className="auth-button primary">
              Back to sign in
            </Link>
            <Link href="/sign-up" className="auth-button">
              Create an account
            </Link>
          </div>
          <p className="auth-footnote">
            Need a place to start?{" "}
            <Link href="/" className="auth-link">
              Continue as a guest
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
