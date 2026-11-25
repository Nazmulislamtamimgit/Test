import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-6xl font-bold text-indigo-600">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-slate-500 dark:text-slate-400">The page you are looking for does not exist.</p>
      <Link href="/" className="btn btn-primary">Back to home</Link>
    </main>
  );
}
