import { db } from "@/db";
import { comments } from "@/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.redirect(new URL("/auth", request.url), { status: 303 });
  }

  const { id } = await params;
  const audioId = Number(id);

  if (!Number.isInteger(audioId) || audioId <= 0) {
    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const body = String(formData.get("body") ?? "").trim();
  const timestampRaw = Number(formData.get("timestampSec") ?? "");

  if (!body) {
    const back = request.headers.get("referer") || new URL("/", request.url).toString();
    return NextResponse.redirect(back, { status: 303 });
  }

  await db.insert(comments).values({
    audioId,
    userId,
    body,
    timestampSec: Number.isFinite(timestampRaw) && timestampRaw > 0 ? Math.floor(timestampRaw) : null,
  });

  const back = request.headers.get("referer") || new URL("/", request.url).toString();
  return NextResponse.redirect(back, { status: 303 });
}
