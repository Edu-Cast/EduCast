import { db } from "@/db";
import { audioTags, audios, tags } from "@/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.redirect(new URL("/auth", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  const audioUrl = String(formData.get("audioUrl") ?? "").trim();
  const transcript = String(formData.get("transcript") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tagsInput = String(formData.get("tags") ?? "").trim();
  const durationSec = Number(formData.get("durationSec") ?? 0);

  if (!title || !topic || !audioUrl) {
    return NextResponse.redirect(new URL("/upload", request.url), { status: 303 });
  }

  const [audio] = await db
    .insert(audios)
    .values({
      userId,
      title,
      topic,
      audioUrl,
      transcript: transcript || null,
      description: description || null,
      durationSec: Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 180,
      plays: 0,
      completionRate: "0",
      score: "0",
    })
    .returning();

  const parsedTags = Array.from(
    new Set(
      tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 8);

  for (const tagName of parsedTags) {
    const [existingTag] = await db.select().from(tags).where(eq(tags.name, tagName)).limit(1);

    const tag =
      existingTag ??
      (
        await db
          .insert(tags)
          .values({ name: tagName })
          .returning()
      )[0];

    const [mapping] = await db
      .select()
      .from(audioTags)
      .where(and(eq(audioTags.audioId, audio.id), eq(audioTags.tagId, tag.id)))
      .limit(1);

    if (!mapping) {
      await db.insert(audioTags).values({ audioId: audio.id, tagId: tag.id });
    }
  }

  return NextResponse.redirect(new URL("/catalog", request.url), { status: 303 });
}
