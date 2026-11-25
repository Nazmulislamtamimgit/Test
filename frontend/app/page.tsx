import Link from "next/link";
import { Activity, CheckSquare, Database, Lock, Server, StickyNote } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const FEATURES = [
  { icon: Lock, title: "Secure auth", text: "bcrypt hashing and JWT in HttpOnly cookies." },
  { icon: CheckSquare, title: "Task manager", text: "Real CRUD with filters, stored in PostgreSQL." },
  { icon: StickyNote, title: "Notes", text: "Create, edit and delete personal notes." },
  { icon: Database, title: "Database check", text: "Test backend to PostgreSQL connectivity live." },
  { icon: Activity, title: "Health monitoring", text: "Frontend, API and database status in one view." },
  { icon: Server, title: "Deployment ready", text: "Nginx, systemd, SSL, firewall and SELinux guides." },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <span className="flex items-center gap-2 text-lg font-semibold"><Server className="h-6 w-6 text-indigo-600" /> HostLab</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn btn-ghost">Log in</Link>
          <Link href="/register" className="btn btn-primary">Get started</Link>
        </div>
      </header>
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Practice real-world Linux hosting</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          A Next.js, Express and PostgreSQL application built to be deployed behind Nginx on Ubuntu or RHEL.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/register" className="btn btn-primary">Create account</Link>
          <Link href="/login" className="btn btn-outline">Log in</Link>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card">
            <Icon className="mb-3 h-6 w-6 text-indigo-600" />
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
