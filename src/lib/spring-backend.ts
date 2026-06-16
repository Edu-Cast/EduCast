const DEFAULT_BACKEND_URL = "http://localhost:8080";

export const AUTH_TOKEN_COOKIE = "educast_jwt";

function getBackendBaseUrl() {
  return process.env.SPRING_BACKEND_URL?.trim() || process.env.BACKEND_API_URL?.trim() || DEFAULT_BACKEND_URL;
}

export function getBackendUrl(path: string) {
  const base = getBackendBaseUrl().replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function readToken(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const candidate = data as Record<string, unknown>;
  const token = candidate.token ?? candidate.accessToken ?? candidate.jwt;

  if (typeof token === "string" && token.length > 0) {
    return token;
  }

  return null;
}

export async function springLogin(params: { email: string; password: string }) {
  try {
    const response = await fetch(getBackendUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false as const, token: null };
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    return { ok: true as const, token: readToken(payload) };
  } catch {
    return { ok: false as const, token: null };
  }
}

export async function springRegister(params: { username: string; email: string; password: string }) {
  try {
    const response = await fetch(getBackendUrl("/api/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false as const, token: null };
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    return { ok: true as const, token: readToken(payload) };
  } catch {
    return { ok: false as const, token: null };
  }
}
