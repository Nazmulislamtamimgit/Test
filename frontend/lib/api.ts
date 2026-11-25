// Single place where the browser talks to the Express API.
// The JWT lives in an HttpOnly cookie, so JavaScript never sees it; we only send credentials.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: { field: string; message: string }[]) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? "GET",
      credentials: "include",
      cache: "no-store",
      headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the backend running?");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? res.statusText, data?.details);
  return data as T;
}

export function errMsg(e: unknown): string {
  if (e instanceof ApiError) {
    const first = e.details?.[0];
    return first ? `${e.message}: ${first.field ? first.field + " - " : ""}${first.message}` : e.message;
  }
  return e instanceof Error ? e.message : "Something went wrong";
}
