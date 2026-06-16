import Link from "next/link";

type SiteHeaderProps = {
  currentUser: {
    id: number;
    username: string;
    fullName: string | null;
  } | null;
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/catalog", label: "Catalog" },
  { href: "/upload", label: "Upload" },
  { href: "/playlists", label: "Playlists" },
];

export function SiteHeader({ currentUser }: SiteHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm text-white">E</span>
          EduCast
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!currentUser && (
            <>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Login
              </Link>
            </>
          )}

          {currentUser ? (
            <div className="hidden rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 sm:block">@{currentUser.username}</div>
          ) : null}

          <details className="relative">
            <summary className="cursor-pointer list-none rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Menu
            </summary>
            <div className="absolute right-0 top-11 z-30 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <div className="grid gap-1">
                <Link href="/" className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                  Main page
                </Link>
                <Link href="/login" className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                  Login
                </Link>
                <Link href="/register" className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                  Register
                </Link>
                <Link href="/catalog" className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                  Search catalog
                </Link>
                <a
                  href="https://github.com/Edu-Cast/EduCast"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  GitHub repository
                </a>
                {currentUser ? (
                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
