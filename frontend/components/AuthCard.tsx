import Link from "next/link";
import type { ReactNode } from "react";
import { Server } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function AuthCard({ title, footer, children }: { title: string; footer: ReactNode; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-semibold">
          <Server className="h-7 w-7 text-indigo-600" /> HostLab
        </Link>
        <div className="card">
          <h1 className="mb-5 text-xl font-semibold">{title}</h1>
          {children}
        </div>
        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">{footer}</p>
      </div>
    </main>
  );
}
