"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { useState } from "react";

interface AuthButtonsProps {
  isGuest: boolean;
  hasGuestNotes: boolean;
  plan: "FREE" | "PRO" | null;
  onSavePermanently: () => void;
}

export default function AuthButtons({
  isGuest,
  hasGuestNotes,
  plan,
  onSavePermanently,
}: AuthButtonsProps) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === "loading") {
    return <span className="account-trigger">Loading...</span>;
  }

  const displayName = session?.user?.name || session?.user?.email || "Account";
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="account-trigger">
      {session && (
        <span className={`plan-chip ${plan === "PRO" ? "pro" : ""}`}>
          {plan === "PRO" ? "Pro" : "Free"}
        </span>
      )}
      {isGuest && hasGuestNotes && (
        <button className="auth-button primary compact-save" onClick={onSavePermanently}>
          Keep my notes
        </button>
      )}
      <button
        className="account-button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        {session ? (
          <span className="avatar">{initials}</span>
        ) : (
          <AccountCircleOutlinedIcon />
        )}
        <span className="account-name">{session ? displayName : "Guest"}</span>
      </button>
      {open && (
        <div className="account-menu" role="menu">
          {session ? (
            <>
              <div className="menu-header">
                <strong>{displayName}</strong>
                <span>{session.user?.email}</span>
              </div>
              <div className={`plan-chip ${plan === "PRO" ? "pro" : ""}`}>
                {plan === "PRO" ? "Pro" : "Free"}
              </div>
              {plan !== "PRO" && (
                <Link href="/pricing" onClick={() => setOpen(false)}>Upgrade to Pro</Link>
              )}
              <Link href="/account" onClick={() => setOpen(false)}>Account & billing</Link>
              <Link href="/pricing" onClick={() => setOpen(false)}>Plans</Link>
              <button onClick={() => void signOut({ callbackUrl: "/" })}>Log out</button>
            </>
          ) : (
            <>
              <div className="menu-header">
                <strong>Guest mode</strong>
                <span>Your notes are saved temporarily on this device.</span>
              </div>
              <button onClick={onSavePermanently}>Keep my notes</button>
              <Link href="/login">Log in</Link>
              <Link href="/sign-up">Create account</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
