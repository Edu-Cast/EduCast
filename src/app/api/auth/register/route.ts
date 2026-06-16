import { db } from "@/db";
import { users } from "@/db/schema";
import { AUTH_COOKIE } from "@/lib/auth";
import { AUTH_TOKEN_COOKIE, springRegister } from "@/lib/spring-backend";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();

  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const emailInput = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!username || username.length < 3 || !emailInput) {
    return NextResponse.redirect(new URL("/register", request.url), { status: 303 });
  }

  const spring = await springRegister({
    username,
    email: emailInput,
    password: password || "demo-password",
  });

  const [existingByUsername] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const [existingByEmail] = await db.select().from(users).where(eq(users.email, emailInput)).limit(1);

  const user =
    existingByUsername ??
    existingByEmail ??
    (
      await db
        .insert(users)
        .values({
          username,
          email: emailInput,
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
