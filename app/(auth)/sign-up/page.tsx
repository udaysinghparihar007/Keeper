"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import HighlightOutlinedIcon from "@mui/icons-material/HighlightOutlined";

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpContent />
    </Suspense>
  );
}

function SignUpContent() {
  const intent = useSearchParams().get("intent");
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <Link href="/" className="brand-link auth-brand">
          <span className="brand-mark"><HighlightOutlinedIcon fontSize="small" /></span>
          Keeper
        </Link>
        <section className="auth-card">
          <p className="eyebrow">Start keeping</p>
          <h1>Create your Keeper account.</h1>
          <p>Keep your notes permanently and access them anywhere.</p>
          {intent === "save" && (
            <div className="auth-context">
              Your existing device notes will be ready to import into this account after sign-in.
            </div>
          )}
          <div className="auth-actions">
            <button className="auth-button primary" onClick={() => void signIn("google", { callbackUrl: "/" })}>
              Create account with Google
            </button>
            <button className="auth-button" onClick={() => void signIn("github", { callbackUrl: "/" })}>
              Create account with GitHub
            </button>
          </div>
          <p className="auth-footnote">
            Already have an account?{" "}
            <Link href="/login" className="auth-link">Sign in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
