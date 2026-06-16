import { db } from "@/db";
import { audios, playlistItems, playlists } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureDemoData } from "@/lib/seed";
import { count, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PlaylistsPage() {
  await ensureDemoData();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  const items = await db
    .select({
      id: playlists.id,
      title: playlists.title,
      description: playlists.description,
      examDate: playlists.examDate,
      createdAt: playlists.createdAt,
      entries: count(playlistItems.audioId),
    })
    .from(playlists)
    .leftJoin(playlistItems, eq(playlistItems.playlistId, playlists.id))
    .where(eq(playlists.userId, user.id))
    .groupBy(playlists.id)
    .orderBy(desc(playlists.createdAt));

  const suggested = await db
    .select({
      id: audios.id,
      title: audios.title,
      topic: audios.topic,
      score: audios.score,
    })
    .from(audios)
    .orderBy(desc(audios.score))
    .limit(5);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">My playlists</h1>
        <p className="mt-2 text-sm text-slate-600">Organize recordings for exam prep and repeat sessions.</p>

        <form action="/api/playlists" method="post" className="mt-5 grid gap-3">
          <input
            name="title"
            required
            maxLength={120}
            placeholder="Playlist title"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
          />
          <textarea
            name="description"
            rows={3}
            placeholder="What is this playlist for?"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
          />
          <input
            name="examDate"
            type="date"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
          />
          <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            Create playlist
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {items.map((pl) => (
            <article key={pl.id} className="rounded-xl border border-slate-200 p-4">
              <h2 className="font-semibold text-slate-950">{pl.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{pl.description ?? "No description"}</p>
              <p className="mt-2 text-xs text-slate-500">
                {pl.entries} recordings {pl.examDate ? `· exam ${pl.examDate}` : ""}
              </p>
            </article>
          ))}
          {items.length === 0 && <p className="text-sm text-slate-500">No playlists yet.</p>}
        </div>
      </section>

      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Suggested to add</h2>
        <div className="mt-4 space-y-2">
          {suggested.map((item) => (
            <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-600">
                {item.topic} · score {Number(item.score).toFixed(1)}
              </p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
