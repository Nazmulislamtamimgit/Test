"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Database, Globe, RefreshCw, Server } from "lucide-react";
import clsx from "clsx";
import { PageHeader, Spinner } from "@/components/ui";
import { api, API_URL, errMsg } from "@/lib/api";
import { fmtUptime } from "@/lib/format";

type Check<T> = { ok: boolean; ms: number; data?: T; error?: string } | null;
type Info = {
  hostname: string; platform: string; arch: string; cpus: number; loadAverage: number[];
  totalMemoryMB: number; freeMemoryMB: number; nodeVersion: string; environment: string;
  processUptimeSeconds: number; systemUptimeSeconds: number; processMemoryMB: number;
};

// Times a request and captures success/failure for display.
async function timed<T>(path: string): Promise<NonNullable<Check<T>>> {
  const t0 = performance.now();
  try {
    const data = await api<T>(path);
    return { ok: true, ms: Math.round(performance.now() - t0), data };
  } catch (e) {
    return { ok: false, ms: Math.round(performance.now() - t0), error: errMsg(e) };
  }
}

function StatusCard({ title, icon, check, children }: { title: string; icon: ReactNode; check: Check<unknown>; children?: ReactNode }) {
  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">{icon}{title}</h2>
        {!check ? <Spinner className="h-4 w-4" /> : (
          <span className={clsx("badge", check.ok ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300")}>
            {check.ok ? "Healthy" : "Down"}
          </span>
        )}
      </div>
      {check && <p className="text-sm text-slate-500">{check.ok ? `Responded in ${check.ms} ms` : check.error}</p>}
      {check?.ok && children}
    </div>
  );
}

export default function StatusPage() {
  const [api1, setApi] = useState<Check<{ uptimeSeconds: number }>>(null);
  const [db, setDb] = useState<Check<{ latencyMs: number; version: string }>>(null);
  const [info, setInfo] = useState<Check<Info>>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const run = useCallback(async () => {
    const [a, d, i] = await Promise.all([
      timed<{ uptimeSeconds: number }>("/health"),
      timed<{ latencyMs: number; version: string }>("/health/database"),
      timed<Info>("/system/info"),
    ]);
    setApi(a); setDb(d); setInfo(i); setCheckedAt(new Date());
  }, []);

  useEffect(() => { run(); const t = setInterval(run, 30_000); return () => clearInterval(t); }, [run]);

  const i = info?.data;
  return (
    <>
      <PageHeader title="System Status" subtitle={checkedAt ? `Last checked ${checkedAt.toLocaleTimeString()} (auto-refresh every 30s)` : "Checking..."}
        action={<button className="btn btn-outline" onClick={run}><RefreshCw className="h-4 w-4" /> Refresh</button>} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatusCard title="Frontend → Backend" icon={<Globe className="h-5 w-5 text-indigo-600" />} check={api1}>
          <p className="mt-2 break-all text-xs text-slate-500">API: {API_URL}</p>
          <p className="text-xs text-slate-500">API uptime: {fmtUptime(api1?.data?.uptimeSeconds ?? 0)}</p>
        </StatusCard>
        <StatusCard title="Backend → Database" icon={<Database className="h-5 w-5 text-indigo-600" />} check={db}>
          <p className="mt-2 text-xs text-slate-500">Query latency: {db?.data?.latencyMs} ms</p>
          <p className="text-xs text-slate-500">{db?.data?.version}</p>
        </StatusCard>
        <StatusCard title="Server info" icon={<Server className="h-5 w-5 text-indigo-600" />} check={info}>
          <p className="mt-2 text-xs text-slate-500">{i?.hostname}</p>
        </StatusCard>
      </div>

      {i && (
        <div className="card mt-6">
          <h2 className="mb-3 font-semibold">Host details</h2>
          <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            {([
              ["Hostname", i.hostname], ["Platform", i.platform], ["Architecture", i.arch], ["CPU cores", i.cpus],
              ["Load average (1/5/15m)", i.loadAverage.join(" / ")],
              ["Memory (free / total)", `${i.freeMemoryMB} / ${i.totalMemoryMB} MB`],
              ["Node.js", i.nodeVersion], ["Environment", i.environment],
              ["API process memory", `${i.processMemoryMB} MB`],
              ["API uptime", fmtUptime(i.processUptimeSeconds)], ["Server uptime", fmtUptime(i.systemUptimeSeconds)],
            ] as [string, string | number][]).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-slate-100 py-1.5 dark:border-slate-800">
                <dt className="text-slate-500">{k}</dt><dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </>
  );
}
