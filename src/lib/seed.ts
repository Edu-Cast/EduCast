import { db } from "@/db";
import { audioTags, audios, comments, likes, playlistItems, playlists, tags, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function ensureDemoData() {
  const existing = await db.select({ id: users.id }).from(users).limit(1);

  if (existing.length > 0) {
    return;
  }

  const insertedUsers = await db
    .insert(users)
    .values([
      {
        username: "alice",
        fullName: "Alice Kim",
        email: "alice@educast.local",
        bio: "Medical student sharing revision recordings.",
      },
      {
        username: "bob",
        fullName: "Bob Ortega",
        email: "bob@educast.local",
        bio: "CS undergrad creating concise explainers.",
      },
      {
        username: "clara",
        fullName: "Clara Petrenko",
        email: "clara@educast.local",
        bio: "Economics mentor focused on exam prep playlists.",
      },
    ])
    .returning();

  const insertedTags = await db
    .insert(tags)
    .values([
      { name: "biology" },
      { name: "algorithms" },
      { name: "macroeconomics" },
      { name: "chemistry" },
      { name: "machine-learning" },
    ])
    .returning();

  if (insertedUsers.length < 3 || insertedTags.length < 5) {
    throw new Error("Failed to initialize demo users or tags");
  }

  const [alice, bob, clara] = insertedUsers;
  const [bioTag, algoTag, macroTag, chemistryTag, aiTag] = insertedTags;

  const insertedAudios = await db
    .insert(audios)
    .values([
      {
        userId: alice.id,
        title: "Cell respiration in 4 minutes",
        description: "Fast revision on glycolysis, Krebs cycle, and ATP output.",
        topic: "Biology",
        audioUrl:
          "https://cdn.pixabay.com/download/audio/2022/03/10/audio_6cb3ec4fce.mp3?filename=soft-piano-logo-13797.mp3",
        transcript: "Cellular respiration converts glucose into ATP in three major stages...",
        durationSec: 248,
        plays: 142,
        completionRate: "78.5",
        score: "84.2",
      },
      {
        userId: bob.id,
        title: "Dijkstra algorithm intuition",
        description: "How shortest path works with a priority queue.",
        topic: "Computer Science",
        audioUrl:
          "https://cdn.pixabay.com/download/audio/2023/06/07/audio_8ea8edd8a4.mp3?filename=chill-abstract-intention-12099.mp3",
        transcript: "Dijkstra explores nodes by always choosing the currently cheapest tentative distance...",
        durationSec: 312,
        plays: 210,
        completionRate: "81.0",
        score: "89.7",
      },
      {
        userId: clara.id,
        title: "Inflation vs unemployment quick recap",
        description: "Phillips curve and policy trade-offs for exam questions.",
        topic: "Economics",
        audioUrl:
          "https://cdn.pixabay.com/download/audio/2022/11/16/audio_a7f7aafdde.mp3?filename=beautiful-relaxing-music-145038.mp3",
        transcript: "Inflation and unemployment often present a short-run trade-off...",
        durationSec: 285,
        plays: 95,
        completionRate: "73.1",
        score: "76.4",
      },
      {
        userId: bob.id,
        title: "Acid-base titration essentials",
        description: "Indicator choice and equivalence point explained simply.",
        topic: "Chemistry",
        audioUrl:
          "https://cdn.pixabay.com/download/audio/2022/08/04/audio_3ea6e1f8ec.mp3?filename=corporate-soft-ambient-11157.mp3",
        transcript: "During acid-base titration, we monitor pH changes as titrant is added...",
        durationSec: 266,
        plays: 67,
        completionRate: "69.3",
        score: "70.8",
      },
    ])
    .returning();

  if (insertedAudios.length < 4) {
    throw new Error("Failed to initialize demo audios");
  }

  const [audio1, audio2, audio3, audio4] = insertedAudios;

  await db.insert(audioTags).values([
    { audioId: audio1.id, tagId: bioTag.id },
    { audioId: audio1.id, tagId: aiTag.id },
    { audioId: audio2.id, tagId: algoTag.id },
    { audioId: audio2.id, tagId: aiTag.id },
    { audioId: audio3.id, tagId: macroTag.id },
    { audioId: audio4.id, tagId: chemistryTag.id },
  ]);

  await db.insert(likes).values([
    { userId: alice.id, audioId: audio2.id },
    { userId: bob.id, audioId: audio1.id },
    { userId: clara.id, audioId: audio2.id },
    { userId: clara.id, audioId: audio1.id },
  ]);

  await db.insert(comments).values([
    {
      audioId: audio2.id,
      userId: alice.id,
      body: "Great explanation! Helped me understand priority queues.",
      timestampSec: 124,
    },
    {
      audioId: audio1.id,
      userId: bob.id,
      body: "Can you also add a short mnemonic for ATP totals?",
      timestampSec: 201,
    },
    {
      audioId: audio3.id,
      userId: alice.id,
      body: "Perfect before macro test.",
    },
  ]);

  const [playlist] = await db
    .insert(playlists)
    .values({
      userId: clara.id,
      title: "Final week crash prep",
      description: "Core materials to replay before the final exam.",
      examDate: "2026-06-20",
    })
    .returning();

  await db.insert(playlistItems).values([
    { playlistId: playlist.id, audioId: audio3.id, position: 1 },
    { playlistId: playlist.id, audioId: audio1.id, position: 2 },
  ]);

  await db
    .update(audios)
    .set({ score: "91.2" })
    .where(eq(audios.id, audio2.id));
}
