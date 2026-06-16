import { db } from "@/db";
import { likes } from "@/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
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

  const [existing] = await db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.audioId, audioId)))
    .limit(1);

  if (existing) {
    await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.audioId, audioId)));
  } else {
    await db.insert(likes).values({ userId, audioId });
  }

  const back = request.headers.get("referer") || new URL("/", request.url).toString();
  return NextResponse.redirect(back, { status: 303 });
}
