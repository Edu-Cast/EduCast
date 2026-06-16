import type { ReactNode } from "react";
import Link from "next/link";
import { db } from "@/db";
import { audioTags, audios, likes, tags, users } from "@/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { ensureDemoData } from "@/lib/seed";
import { IconCap, IconHeadphones, IconHeart, IconNext, IconPlay, IconPlaylist, IconPrev, IconSearch, IconUser, IconVolume } from "@/components/icons";
import { countDistinct, desc, eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureDemoData();
  const currentUserId = await getCurrentUserId();

  const items = await db
    .select({
      id: audios.id,
      title: audios.title,
      topic: audios.topic,
      audioUrl: audios.audioUrl,
      durationSec: audios.durationSec,
      score: audios.score,
      author: users.username,
    })
    .from(audios)
    .innerJoin(users, eq(users.id, audios.userId))
    .orderBy(desc(audios.score), desc(audios.createdAt))
    .limit(16);

  const ids = items.map((item) => item.id);

  const likesRows =
    ids.length > 0
      ? await db
          .select({
            audioId: likes.audioId,
            likesCount: countDistinct(likes.userId),
          })
          .from(likes)
          .where(inArray(likes.audioId, ids))
          .groupBy(likes.audioId)
      : [];

  const likesMap = new Map<number, number>();
  for (const row of likesRows) likesMap.set(row.audioId, row.likesCount);

  const tagRows =
    ids.length > 0
      ? await db
          .select({ audioId: audioTags.audioId, name: tags.name })
          .from(audioTags)
          .innerJoin(tags, eq(tags.id, audioTags.tagId))
          .where(inArray(audioTags.audioId, ids))
      : [];

  const tagsMap = new Map<number, string[]>();
  for (const row of tagRows) {
    const current = tagsMap.get(row.audioId) ?? [];
    current.push(row.name);
    tagsMap.set(row.audioId, current);
  }

  const interesting = items.slice(0, 8);
  const popular = items.slice(6, 14).length > 0 ? items.slice(6, 14) : items;
  const nowPlaying = interesting[0] ?? items[0];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--ec-bg-app)] pb-32 text-[var(--ec-text-light)]">
      <div className="grid min-h-screen lg:grid-cols-[250px_1fr]">
        <aside className="relative hidden overflow-hidden bg-[var(--ec-bg-dark)] px-7 py-8 lg:block">
          <div className="absolute -bottom-20 -left-10 h-48 w-60 rounded-full bg-white/35 blur-2xl" />
          <div className="absolute -bottom-12 left-14 h-28 w-32 rounded-full bg-[#c8d9ff]/70 blur-xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 text-[40px] font-semibold tracking-tight">
              <IconCap className="h-10 w-10" />
              <span>EduCast</span>
            </div>

            <nav className="mt-14 space-y-6 text-[42px] font-semibold leading-none">
              <NavLink href="/catalog" icon={<IconSearch className="h-9 w-9" />} label="Search" />
              <NavLink href="/upload" icon={<IconHeadphones className="h-9 w-9" />} label="Your lectures" />
              <NavLink href="/" icon={<IconHeart className="h-9 w-9" />} label="Liked lectures" />
              <NavLink href="/playlists" icon={<IconPlaylist className="h-9 w-9" />} label="Your playlists" />
            </nav>
          </div>
        </aside>

        <section className="p-3 sm:p-4 md:p-5 lg:p-6">
          <div className="mb-3 flex items-center gap-2 rounded-2xl bg-[var(--ec-bg-dark)] px-3 py-2 lg:hidden">
            <IconCap className="h-6 w-6" />
            <span className="text-lg font-semibold">EduCast</span>
            <div className="ml-auto flex items-center gap-2">
              <Link href="/catalog" className="ec-interactive ec-focus rounded-lg bg-white/10 p-2">
                <IconSearch className="h-4 w-4" />
              </Link>
              <Link href="/playlists" className="ec-interactive ec-focus rounded-lg bg-white/10 p-2">
                <IconPlaylist className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <header className="relative overflow-hidden rounded-[var(--ec-radius-xl)] bg-[var(--ec-bg-banner)] p-4 shadow-[0_16px_40px_rgba(17,35,84,0.2)] sm:p-5 lg:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-30%,rgba(214,226,255,0.95),rgba(92,126,216,0.25)_45%,rgba(17,40,103,0.92)_80%)]" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <h1 className="text-[32px] font-semibold tracking-[-0.02em] sm:text-[40px] md:text-[48px] lg:text-[56px]">Good evening!</h1>
              <details className="relative">
                <summary className="ec-interactive ec-focus list-none cursor-pointer rounded-full bg-[#0d2a70]/75 p-2.5 sm:p-3">
                  <IconUser className="h-7 w-7 sm:h-9 sm:w-9" />
                </summary>
                <div className="absolute right-0 top-14 z-30 w-48 rounded-xl border border-white/20 bg-[#0f2a70] p-2 text-white shadow-xl">
                  <Link href="/login" className="block rounded-lg px-3 py-2 text-sm hover:bg-white/10">
                    Login
                  </Link>
                  <Link href="/register" className="block rounded-lg px-3 py-2 text-sm hover:bg-white/10">
                    Register
                  </Link>
                  <a
                    href="https://github.com/Edu-Cast/EduCast"
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-white/10"
                  >
                    GitHub
                  </a>
                </div>
              </details>
            </div>
          </header>

          <div className="mt-4 rounded-[var(--ec-radius-xl)] bg-[var(--ec-bg-dark-2)] p-4 shadow-[0_16px_40px_rgba(17,35,84,0.22)] sm:p-5">
            <SectionRow title="Interesting for you" items={interesting} likesMap={likesMap} tagsMap={tagsMap} currentUserId={currentUserId} />
            <SectionRow title="Popular lectures" items={popular} likesMap={likesMap} tagsMap={tagsMap} currentUserId={currentUserId} />
          </div>
        </section>
      </div>

      {nowPlaying ? (
        <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-white/30 bg-[#112d69]/95 px-2 py-2 backdrop-blur-md sm:px-3">
          <div className="mx-auto max-w-[1600px]">
            <div className="mb-2 flex items-center justify-center">
              <div className="h-[5px] w-[94%] rounded-full bg-white/35">
                <div className="h-full w-[38%] rounded-full bg-[#a9c3ff]" />
              </div>
            </div>

            <div className="grid grid-cols-1 items-center gap-2 text-white md:grid-cols-[280px_1fr_280px] md:gap-4 lg:grid-cols-[320px_1fr_320px]">
              <div className="hidden items-center gap-3 rounded-2xl border border-white/25 bg-white/10 p-2 md:flex">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#c8d8f8] text-[#163773] lg:h-14 lg:w-14">
                  <IconCap className="h-7 w-7" />
                </div>
                <div>
                  <p className="line-clamp-1 text-sm font-semibold">{nowPlaying.title}</p>
                  <p className="text-xs text-white/70">{nowPlaying.author}</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-5 sm:gap-7 md:gap-9">
                <IconVolume className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10" />
                <button className="ec-interactive ec-focus ec-press rounded-full p-1">
                  <IconPrev className="h-8 w-8 sm:h-9 sm:w-9 md:h-11 md:w-11" />
                </button>
                <button className="ec-interactive ec-focus ec-press rounded-full bg-white p-1.5 text-[#102b66] md:p-2">
                  <IconPlay className="h-7 w-7 sm:h-8 sm:w-8" />
                </button>
                <button className="ec-interactive ec-focus ec-press rounded-full p-1">
                  <IconNext className="h-8 w-8 sm:h-9 sm:w-9 md:h-11 md:w-11" />
                </button>
                <form action={`/api/audios/${nowPlaying.id}/like`} method="post">
                  <button type="submit" className="ec-interactive ec-focus ec-press rounded-full p-1">
                    <IconHeart className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10" />
                  </button>
                </form>
              </div>

              <audio className="w-full" controls preload="none" src={nowPlaying.audioUrl} />
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} className="ec-interactive ec-focus flex items-center gap-3 rounded-xl px-1 py-1 text-white/90 hover:bg-white/10 hover:text-white">
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function SectionRow({
  title,
  items,
  likesMap,
  tagsMap,
  currentUserId,
}: {
  title: string;
  items: Array<{
    id: number;
    title: string;
    topic: string;
    durationSec: number;
    score: string;
  }>;
  likesMap: Map<number, number>;
  tagsMap: Map<number, string[]>;
  currentUserId: number | null;
}) {
  return (
    <section className="mb-7 last:mb-0">
      <h2 className="mb-3 text-[28px] font-semibold tracking-[-0.02em] sm:text-[36px] lg:mb-4 lg:text-[52px]">{title}</h2>

      <div className="ec-scroll-row flex gap-3 overflow-x-auto pb-2 sm:gap-4">
        {items.map((item) => (
          <article key={`${title}-${item.id}`} className="w-[165px] shrink-0 sm:w-[185px] lg:w-[200px]">
            <div className="ec-interactive rounded-2xl bg-[#d8e4fa] p-2 text-[#173978] shadow-[0_6px_14px_rgba(9,25,75,0.2)]">
              <div className="relative grid h-[128px] place-items-center rounded-xl bg-[radial-gradient(circle_at_40%_30%,#eef4ff,#b8cdf5_58%,#8aa9de)] sm:h-[146px] lg:h-[160px]">
                <IconHeadphones className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16" />
                <span className="absolute right-2 top-2">
                  <IconCap className="h-5 w-5 lg:h-6 lg:w-6" />
                </span>
              </div>
              <p className="mt-1 text-center text-[11px] font-semibold lg:text-xs">{item.topic}</p>
            </div>

            <p className="mt-2 line-clamp-1 text-xs text-white/95 sm:text-sm">{item.title}</p>
            <p className="text-[10px] text-white/75 sm:text-xs">
              {Math.round(item.durationSec / 60)}:{String(item.durationSec % 60).padStart(2, "0")} · ♥ {likesMap.get(item.id) ?? 0} ·
              score {Number(item.score).toFixed(1)}
            </p>

            <div className="mt-1 flex flex-wrap gap-1">
              {(tagsMap.get(item.id) ?? []).slice(0, 2).map((tag) => (
                <span key={`${item.id}-${tag}`} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/85">
                  #{tag}
                </span>
              ))}
            </div>

            {currentUserId ? (
              <form action={`/api/audios/${item.id}/like`} method="post" className="mt-1">
                <button type="submit" className="ec-interactive ec-focus ec-press rounded-md px-1 text-[11px] text-white/80 underline underline-offset-2 sm:text-xs">
                  like / unlike
                </button>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
