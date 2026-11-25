"use client";
import { useEffect, type ReactNode } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import clsx from "clsx";

export const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={clsx("h-5 w-5 animate-spin", className)} />
);

export const PageLoader = () => (
  <div className="flex justify-center py-16 text-slate-400"><Spinner className="h-8 w-8" /></div>
);

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      <AlertCircle className="h-4 w-4 shrink-0" /> <span className="flex-1">{message}</span>
      {onRetry && <button onClick={onRetry} className="font-medium underline">Retry</button>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
        className="card max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost !p-1.5" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon, tone = "indigo" }: {
  label: string; value: number | string; icon: ReactNode; tone?: "indigo" | "green" | "amber" | "red" | "sky";
}) {
  const tones = {
    indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
    green: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-300",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    red: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300",
    sky: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={clsx("rounded-lg p-3", tones[tone])}>{icon}</div>
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export const STATUS_STYLE: Record<string, string> = {
  TODO: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  DONE: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
};
export const PRIORITY_STYLE: Record<string, string> = {
  LOW: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  MEDIUM: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  HIGH: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};
export const STATUS_LABEL: Record<string, string> = { TODO: "To do", IN_PROGRESS: "In progress", DONE: "Done" };
