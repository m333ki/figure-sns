import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { extractHashtags } from "@/lib/hashtags";

// Recomputed from posts on every request -- the dataset is small enough
// (early-stage app) that this is simpler and always-fresh, with no cache
// invalidation to get wrong. Revisit with a materialized/cached view if the
// posts table grows large enough for this to matter.
export const dynamic = "force-dynamic";

const WINDOW_DAYS = 7;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 20;

// Admin-curated placeholders shown until real hashtag usage exists, per the
// feature spec's fallback requirement -- there's no admin UI in this app
// yet, so this is the "fixed keyword list a developer edits" version of
// that ask rather than a full admin-configurable system. Kept at 20 entries
// so the sidebar's 5-item collapsed / 20-item expanded view has something
// to expand into even before real hashtag usage exists.
const FALLBACK_HASHTAGS = [
  "初音ミク",
  "ねんどろいど",
  "figma",
  "デトルフ",
  "スケールフィギュア",
  "ガレージキット",
  "プライズ",
  "アクリルスタンド",
  "東方Project",
  "ラブライブ",
  "アイドルマスター",
  "鬼滅の刃",
  "呪術廻戦",
  "ドラゴンボール",
  "ワンピース",
  "進撃の巨人",
  "五等分の花嫁",
  "リゼロ",
  "けものフレンズ",
  "ジオラマ",
];

export type TrendingHashtag = {
  tag: string;
  postCount: number;
  likeTotal: number;
  isFallback: boolean;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.trunc(requestedLimit), MAX_LIMIT)
      : DEFAULT_LIMIT;

  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("posts")
    .select("caption, like_count")
    .gte("created_at", since)
    .not("caption", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stats = new Map<string, { postCount: number; likeTotal: number }>();
  for (const row of data as { caption: string | null; like_count: number | null }[]) {
    if (!row.caption) continue;
    for (const tag of extractHashtags(row.caption)) {
      const entry = stats.get(tag) ?? { postCount: 0, likeTotal: 0 };
      entry.postCount += 1;
      entry.likeTotal += row.like_count ?? 0;
      stats.set(tag, entry);
    }
  }

  // Post count is the primary signal (a tag several different posts used
  // reads as more "trending" than one post that happens to be popular);
  // total likes only breaks ties between equally-used tags.
  const ranked: TrendingHashtag[] = [...stats.entries()]
    .map(([tag, { postCount, likeTotal }]) => ({ tag, postCount, likeTotal, isFallback: false }))
    .sort((a, b) => b.postCount - a.postCount || b.likeTotal - a.likeTotal)
    .slice(0, limit);

  if (ranked.length < limit) {
    const used = new Set(ranked.map((r) => r.tag));
    for (const tag of FALLBACK_HASHTAGS) {
      if (ranked.length >= limit) break;
      if (used.has(tag)) continue;
      ranked.push({ tag, postCount: 0, likeTotal: 0, isFallback: true });
    }
  }

  return NextResponse.json({ hashtags: ranked });
}
