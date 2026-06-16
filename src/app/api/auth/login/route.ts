import { db } from "@/db";
import { users } from "@/db/schema";
import { AUTH_COOKIE } from "@/lib/auth";
import { ensureDemoData } from "@/lib/seed";
import { AUTH_TOKEN_COOKIE, springLogin } from "@/lib/spring-backend";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await ensureDemoData();

  const formData = await request.formData();
  const usernameInput = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const emailInput = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const passwordInput = String(formData.get("password") ?? "").trim();

  const identifier = emailInput || usernameInput;

  if (!identifier || identifier.length < 3) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const spring = await springLogin({
    email: emailInput || `${identifier}@educast.local`,
    password: passwordInput || "demo-password",
  });

  const [existingByEmail] = emailInput ? await db.select().from(users).where(eq(users.email, emailInput)).limit(1) : [undefined];

  const [existingByUsername] = !existingByEmail
    ? await db
        .select()
        .from(users)
        .where(eq(users.username, identifier.includes("@") ? identifier.split("@")[0] : identifier))
        .limit(1)
    : [undefined];

  const existing = existingByEmail ?? existingByUsername;

  const fallbackUsername = identifier.includes("@") ? identifier.split("@")[0] : identifier;

  const user =
    existing ??
    (
      await db
        .insert(users)
        .values({
          username: fallbackUsername,
          email: emailInput || `${fallbackUsername}@educast.local`,
        })
        .returning()
    )[0];

  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });

  response.cookies.set(AUTH_COOKIE, String(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  if (spring.ok && spring.token) {
    response.cookies.set(AUTH_TOKEN_COOKIE, spring.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }

  return response;
}
