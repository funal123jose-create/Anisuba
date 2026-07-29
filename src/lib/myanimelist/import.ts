import { gunzipSync } from "node:zlib";

export type MyAnimeListEntry = {
  malId: number;
  title: string;
  mediaType: string;
  totalEpisodes: number;
  watchedEpisodes: number;
  score: number;
  status: "watching" | "completed" | "paused" | "dropped" | "plan_to_watch";
  startDate: string | null;
  finishDate: string | null;
};

const statusMap: Record<string, MyAnimeListEntry["status"]> = {
  Watching: "watching",
  Completed: "completed",
  "On-Hold": "paused",
  Dropped: "dropped",
  "Plan to Watch": "plan_to_watch",
};

function decodeXml(value: string) {
  return value
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number(decimal)))
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function field(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function numberField(block: string, name: string) {
  const parsed = Number(field(block, name));
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
}

function dateField(block: string, name: string) {
  const value = field(block, name);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value !== "0000-00-00" ? value : null;
}

export function parseMyAnimeListExport(bytes: Uint8Array, filename: string) {
  if (bytes.byteLength > 2_500_000) throw new Error("MAL_FILE_TOO_LARGE");
  const decompressed = filename.toLowerCase().endsWith(".gz")
    ? gunzipSync(bytes, { maxOutputLength: 15_000_000 })
    : Buffer.from(bytes);
  const xml = decompressed.toString("utf8");
  if (!xml.includes("<myanimelist>")) throw new Error("MAL_INVALID_XML");

  const entries: MyAnimeListEntry[] = [];
  for (const match of xml.matchAll(/<anime>([\s\S]*?)<\/anime>/gi)) {
    const block = match[1];
    const malId = numberField(block, "series_animedb_id");
    const title = field(block, "series_title");
    const rawStatus = field(block, "my_status");
    const status = statusMap[rawStatus];
    if (!malId || !title || !status) continue;
    const totalEpisodes = numberField(block, "series_episodes");
    const watchedEpisodes = status === "completed" && totalEpisodes > 0
      ? totalEpisodes
      : Math.min(numberField(block, "my_watched_episodes"), totalEpisodes || 10000);
    entries.push({
      malId,
      title,
      mediaType: field(block, "series_type") || "Unknown",
      totalEpisodes,
      watchedEpisodes,
      score: Math.min(numberField(block, "my_score"), 10),
      status,
      startDate: dateField(block, "my_start_date"),
      finishDate: dateField(block, "my_finish_date"),
    });
  }
  if (entries.length === 0) throw new Error("MAL_NO_ENTRIES");
  return entries;
}
