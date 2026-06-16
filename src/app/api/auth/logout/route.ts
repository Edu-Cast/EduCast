import { AUTH_COOKIE } from "@/lib/auth";
import { AUTH_TOKEN_COOKIE } from "@/lib/spring-backend";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });

  response.cookies.set(AUTH_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(AUTH_TOKEN_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
