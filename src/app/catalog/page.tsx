import { db } from "@/db";
import { audioTags, audios, tags, users } from "@/db/schema";
import { ensureDemoData } from "@/lib/seed";
import { and, asc, countDistinct, desc, eq, ilike, inArray, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

type CatalogSearchParams = Promise<{
  q?: string;
  topic?: string;
}>;

export default async function CatalogPage({ searchParams }: { searchParams: CatalogSearchParams }) {
  await ensureDemoData();

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const topic = (sp.topic ?? "all").trim();

  const topics = await db
    .selectDistinct({ topic: audios.topic })
    .from(audios)
    .orderBy(asc(audios.topic));

  const records = await db
    .select({
      id: audios.id,
      title: audios.title,
      description: audios.description,
      topic: audios.topic,
      durationSec: audios.durationSec,
      score: audios.score,
      author: users.username,
      tagsCount: countDistinct(audioTags.tagId),
    })
    .from(audios)
    .innerJoin(users, eq(users.id, audios.userId))
    .leftJoin(audioTags, eq(audioTags.audioId, audios.id))
    .where(
      andSearch({ q, topic }),
    )
    .groupBy(audios.id, users.username)
    .orderBy(desc(audios.score), desc(audios.createdAt));

  const ids = records.map((r) => r.id);
  const tagRows =
    ids.length > 0
      ? await db
          .select({ audioId: audioTags.audioId, tagName: tags.name })
          .from(audioTags)
          .innerJoin(tags, eq(tags.id, audioTags.tagId))
          .where(inArray(audioTags.audioId, ids))
      : [];

  const tagMap = new Map<number, string[]>();
  for (const row of tagRows) {
    const current = tagMap.get(row.audioId) ?? [];
    current.push(row.tagName);
    tagMap.set(row.audioId, current);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Catalog & Search</h1>
        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]" method="get">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by title, topic, transcript, description"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
          />
          <select
            name="topic"
            defaultValue={topic}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
          >
            <option value="all">All topics</option>
            {topics.map((item) => (
              <option key={item.topic} value={item.topic}>
                {item.topic}
              </option>
            ))}
          </select>
          <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            Search
          </button>
        </form>
      </section>

      <section className="grid gap-3">
        {records.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-md bg-indigo-50 px-2 py-1 font-medium text-indigo-700">{item.topic}</span>
              <span>by @{item.author}</span>
              <span>· score {Number(item.score).toFixed(1)}</span>
              <span>· {Math.round(item.durationSec / 60)} min</span>
            </div>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">{item.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{item.description ?? "No description"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(tagMap.get(item.id) ?? []).map((tag) => (
                <span key={`${item.id}-${tag}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                  #{tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function andSearch({ q, topic }: { q: string; topic: string }) {
  const conditions = [];

  if (q) {
    conditions.push(
      or(
        ilike(audios.title, `%${q}%`),
        ilike(audios.topic, `%${q}%`),
        ilike(audios.description, `%${q}%`),
        ilike(audios.transcript, `%${q}%`),
      ),
    );
  }

  if (topic && topic !== "all") {
    conditions.push(eq(audios.topic, topic));
  }

  if (conditions.length === 0) {
    return undefined;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
}
