import { db } from "@/db";
import { playlists } from "@/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.redirect(new URL("/auth", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const examDate = String(formData.get("examDate") ?? "").trim();

  if (!title) {
    return NextResponse.redirect(new URL("/playlists", request.url), { status: 303 });
  }

  await db.insert(playlists).values({
    userId,
    title,
    description: description || null,
    examDate: examDate || null,
  });

  return NextResponse.redirect(new URL("/playlists", request.url), { status: 303 });
}
