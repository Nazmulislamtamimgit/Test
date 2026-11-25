"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CheckSquare, Clock, StickyNote } from "lucide-react";
import { ErrorBox, PageHeader, PageLoader, PRIORITY_STYLE, STATUS_LABEL, STATUS_STYLE, StatCard } from "@/components/ui";
import { api, errMsg } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import type { Stats } from "@/lib/types";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    api<Stats>("/users/stats").then(setStats).catch((e) => setError(errMsg(e)));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!stats) return <PageLoader />;

  const { tasks } = stats;
  const pct = tasks.total ? Math.round((tasks.DONE / tasks.total) * 100) : 0;

  return (
    <>
      <PageHeader title={`Hello, ${user?.name.split(" ")[0]}`} subtitle="Here is an overview of your workspace." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total tasks" value={tasks.total} icon={<CheckSquare className="h-5 w-5" />} />
        <StatCard label="In progress" value={tasks.IN_PROGRESS} icon={<Clock className="h-5 w-5" />} tone="amber" />
        <StatCard label="Completed" value={tasks.DONE} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
        <StatCard label="Overdue" value={tasks.overdue} icon={<AlertTriangle className="h-5 w-5" />} tone="red" />
        <StatCard label="Notes" value={stats.notes} icon={<StickyNote className="h-5 w-5" />} tone="sky" />
      </div>

      <div className="card mt-6">
        <div className="mb-2 flex justify-between text-sm"><span className="font-medium">Completion</span><span>{pct}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="card mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent tasks</h2>
          <Link href="/tasks" className="text-sm font-medium text-indigo-600">View all</Link>
        </div>
        {stats.recentTasks.length === 0 ? (
          <p className="text-sm text-slate-500">No tasks yet. <Link href="/tasks" className="text-indigo-600">Create one</Link>.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {stats.recentTasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="font-medium">{t.title}</span>
                <span className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Due {fmtDate(t.dueDate)}</span>
                  <span className={`badge ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</span>
                  <span className={`badge ${STATUS_STYLE[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
