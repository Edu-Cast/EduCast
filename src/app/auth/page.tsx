import Link from "next/link";

export default function AuthHubPage() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-950">Authentication</h1>
      <p className="mt-2 text-sm text-slate-600">
        Use dedicated pages for authentication flow in this project.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
