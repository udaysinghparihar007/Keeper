"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BillingStatus = { plan: "FREE" | "PRO" };

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/billing/status")
      .then(async (response) => (response.ok ? response.json() : null))
      .then((value: BillingStatus | null) => setBilling(value))
      .catch(() => setBilling(null));
  }, []);

  async function startCheckout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: "/pricing" }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Unable to start checkout");
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout");
      setLoading(false);
    }
  }

  return (
    <main className="pricing-page">
      <div className="page-intro">
        <p className="eyebrow">Plans</p>
        <h1>Keep the tools simple. Choose what fits.</h1>
        <p>Keeper is useful for free. Pro adds room and flexibility when your notes become part of your daily rhythm.</p>
      </div>
      <div className="pricing-grid">
        <section className="plan-card">
          <p className="eyebrow">For getting started</p>
          <h2>Free</h2>
          <p className="plan-price">$0</p>
          <ul className="plan-list">
            <li>Permanent account storage</li>
            <li>Basic note creation and editing</li>
            <li>Up to 100 notes</li>
          </ul>
          <span className="plan-chip">{billing?.plan === "FREE" ? "Current plan" : "Available"}</span>
        </section>
        <section className="plan-card pro">
          <p className="eyebrow">For a growing workspace</p>
          <h2>Pro</h2>
          <p className="plan-price">$5 <small>/ month</small></p>
          <ul className="plan-list">
            <li>Everything in Free</li>
            <li>Export your notes as CSV</li>
            <li>Up to 10,000 notes</li>
          </ul>
          {billing?.plan === "PRO" ? (
            <Link className="auth-button primary" href="/account">Manage subscription</Link>
          ) : (
            <button className="auth-button primary" onClick={() => void startCheckout()} disabled={loading}>
              {loading ? "Opening checkout..." : "Upgrade to Pro"}
            </button>
          )}
          {error && <p className="status-message">{error}</p>}
        </section>
      </div>
      <Link href="/" className="auth-link account-back">Back to notes</Link>
    </main>
  );
}
