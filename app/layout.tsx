import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "TOS Sentinel",
  description: "Threat intelligence for the fine print.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getCurrentProfile();

  return (
    <html lang="en">
      <body>
        <header className="border-b bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-xl font-bold text-slate-950">
              TOS Sentinel
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
              <Link href="/services">Services</Link>
              <Link href="/suggest">Suggest</Link>
              {profile ? <Link href="/dashboard">Dashboard</Link> : <Link href="/login">Sign in</Link>}
              {profile?.role === "admin" || profile?.role === "reviewer" ? <Link href="/admin">Admin</Link> : null}
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
