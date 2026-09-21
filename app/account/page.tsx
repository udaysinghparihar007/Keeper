"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";

type BillingStatus = {
  plan: "FREE" | "PRO";
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
};

export default function AccountPage() {
  const { data: session } = useSession();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/billing/status")
      .then(async (response) => {
        if (!response.ok) throw new Error("Sign in to view your account.");
        return response.json();
      })
      .then((value: BillingStatus) => setBilling(value))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Unable to load account."))
      .finally(() => setLoading(false));
  }, []);

  async function openPortal() {
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const result = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !result.url) {
      setMessage(result.error ?? "Unable to open billing management.");
      return;
    }
    window.location.assign(result.url);
  }

  return (
    <main className="account-page">
      <div className="page-intro">
        <p className="eyebrow">Account</p>
        <h1>Your Keeper account.</h1>
        <p>Manage your profile, storage, and plan without leaving the calm of your workspace.</p>
      </div>
      {loading ? (
        <div className="empty-state"><p>Loading account details...</p></div>
      ) : billing ? (
        <div className="settings-grid">
          <section className="settings-card">
            <h2>Profile</h2>
            <p className="detail-label">Name</p>
            <p className="detail-value">{session?.user?.name || "Keeper user"}</p>
            <p className="detail-label">Email</p>
            <p className="detail-value">{session?.user?.email}</p>
            <button className="auth-button" onClick={() => void signOut({ callbackUrl: "/" })}>
              Log out
            </button>
          </section>
          <section className={`settings-card plan-card ${billing.plan === "PRO" ? "pro" : ""}`}>
            <h2>Current plan</h2>
            <p className="plan-price">{billing.plan === "PRO" ? "Pro" : "Free"}</p>
            <p>{billing.plan === "PRO" ? "Your notes and export tools are unlocked." : "Permanent note storage for getting started."}</p>
            {billing.subscription && (
              <>
                <p className="detail-label">Status</p>
                <p className="detail-value">{billing.subscription.status.toLowerCase()}</p>
                {billing.subscription.currentPeriodEnd && (
                  <p className="detail-label">
                    Renews {new Date(billing.subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
                {billing.subscription.cancelAtPeriodEnd && (
                  <p className="status-message">Pro access remains active until the current period ends.</p>
                )}
              </>
            )}
            {billing.plan === "PRO" ? (
              <button className="auth-button primary" onClick={() => void openPortal()}>
                Manage subscription
              </button>
            ) : (
              <Link className="auth-button primary" href="/pricing">Explore Pro</Link>
            )}
          </section>
        </div>
      ) : (
        <div className="empty-state"><p>{message}</p></div>
      )}
      <Link href="/" className="auth-link account-back">Back to notes</Link>
    </main>
  );
}
