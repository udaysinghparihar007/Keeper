"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import HighlightOutlinedIcon from "@mui/icons-material/HighlightOutlined";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const intent = useSearchParams().get("intent");
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <Link href="/" className="brand-link auth-brand">
          <span className="brand-mark"><HighlightOutlinedIcon fontSize="small" /></span>
          Keeper
        </Link>
        <section className="auth-card">
          <p className="eyebrow">Welcome back</p>
          <h1>Your notes are waiting.</h1>
          <p>Sign in to keep your notes permanent and pick up wherever you left off.</p>
          {intent === "save" && (
            <div className="auth-context">
              Your device notes will stay safe while you sign in. You can import them when you return.
            </div>
          )}
          <div className="auth-actions">
            <button className="auth-button primary" onClick={() => void signIn("google", { callbackUrl: "/" })}>
              Continue with Google
            </button>
            <button className="auth-button" onClick={() => void signIn("github", { callbackUrl: "/" })}>
              Continue with GitHub
            </button>
          </div>
          <div className="auth-divider">or</div>
          <p className="auth-footnote">
            New to Keeper?{" "}
            <Link href="/sign-up" className="auth-link">Create an account</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
