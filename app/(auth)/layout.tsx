import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Keeper Auth",
  description: "Authentication screens for the Keeper application",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="auth-route-shell">{children}</div>;
}
