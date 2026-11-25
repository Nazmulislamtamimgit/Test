"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import clsx from "clsx";

type Kind = "success" | "error" | "info";
type Item = { id: number; kind: Kind; message: string };
type Api = { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void };

const Ctx = createContext<Api>({ success() {}, error() {}, info() {} });
let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const push = useCallback((kind: Kind, message: string) => {
    const id = nextId++;
    setItems((s) => [...s, { id, kind, message }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 4500);
  }, []);
  const api = useMemo<Api>(
    () => ({ success: (m) => push("success", m), error: (m) => push("error", m), info: (m) => push("info", m) }),
    [push]
  );
  const Icon = { success: CheckCircle2, error: XCircle, info: Info };
  return (
    <Ctx.Provider value={api}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((t) => {
          const I = Icon[t.kind];
          return (
            <div key={t.id} role="status" className={clsx(
              "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg bg-white dark:bg-slate-900",
              t.kind === "success" && "border-green-300 text-green-800 dark:border-green-800 dark:text-green-300",
              t.kind === "error" && "border-red-300 text-red-800 dark:border-red-800 dark:text-red-300",
              t.kind === "info" && "border-indigo-300 text-indigo-800 dark:border-indigo-800 dark:text-indigo-300"
            )}>
              <I className="mt-0.5 h-4 w-4 shrink-0" /> <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
export const useToast = () => useContext(Ctx);
