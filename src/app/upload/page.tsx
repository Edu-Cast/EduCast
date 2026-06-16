import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-950">Upload audio explanation</h1>
      <p className="mt-2 text-sm text-slate-600">
        Add a short revision recording. Transcript and tags power search, classification, and recommendations.
      </p>

      <form action="/api/audios" method="post" className="mt-6 grid gap-4">
        <label className="grid gap-1 text-sm text-slate-700">
          Title
          <input
            name="title"
            required
            maxLength={180}
            className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-indigo-200 focus:ring"
            placeholder="Example: Derivatives in 5 minutes"
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-700">
          Topic
          <input
            name="topic"
            required
            maxLength={120}
            className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-indigo-200 focus:ring"
            placeholder="Mathematics"
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-700">
          Audio URL (MP3/stream)
          <input
            name="audioUrl"
            type="url"
            required
            className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-indigo-200 focus:ring"
            placeholder="https://..."
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-700">
          Transcript (speech-to-text output)
          <textarea
            name="transcript"
            rows={6}
            className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-indigo-200 focus:ring"
            placeholder="Paste generated transcript here..."
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-700">
          Description
          <textarea
            name="description"
            rows={3}
            className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-indigo-200 focus:ring"
            placeholder="Short summary for catalog card"
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-700">
          Tags (comma separated)
          <input
            name="tags"
            className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-indigo-200 focus:ring"
            placeholder="exam, derivatives, calculus"
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-700">
          Duration (seconds)
          <input
            type="number"
            min={10}
            max={5400}
            name="durationSec"
            defaultValue={180}
            className="rounded-xl border border-slate-300 px-3 py-2 outline-none ring-indigo-200 focus:ring"
          />
        </label>

        <button className="mt-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
          Upload recording
        </button>
      </form>

      <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        Telegram quick upload can be connected through a bot webhook to this API endpoint in future iterations.
      </div>
    </div>
  );
}
