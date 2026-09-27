"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { hashtagSearchHref } from "@/lib/hashtags";
import type { TrendingHashtag } from "@/app/api/trends/route";

const TRENDING_COUNT = 20;

export default function TrendingHashtags() {
  const [hashtags, setHashtags] = useState<TrendingHashtag[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/trends?limit=${TRENDING_COUNT}`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: { hashtags: TrendingHashtag[] }) => {
        if (!cancelled) setHashtags(data.hashtags);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p className="py-6 text-center text-xs text-muted">
        トレンドを取得できませんでした
      </p>
    );
  }

  if (!hashtags) {
    return (
      <p className="py-6 text-center text-xs text-muted">
        読み込み中...
      </p>
    );
  }

  if (hashtags.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Sparkles size={20} className="text-gray-300 dark:text-gray-600" />
        <p className="text-xs text-muted">準備中です</p>
      </div>
    );
  }

  return (
    <div>
      <ul>
        {hashtags.map((item, index) => (
          <li key={item.tag}>
            <Link
              href={hashtagSearchHref(item.tag)}
              className="flex items-center gap-3 rounded-lg px-1.5 py-2 transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span
                className={`w-4 shrink-0 text-right text-sm font-bold ${
                  index < 3
                    ? "text-accent"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  #{item.tag}
                </p>
                <p className="text-xs text-muted">
                  {item.isFallback ? "注目ワード" : `${item.postCount.toLocaleString()}件の投稿`}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
