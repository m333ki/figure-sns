"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { hashtagSearchHref } from "@/lib/hashtags";
import type { TrendingHashtag } from "@/app/api/trends/route";

const COLLAPSED_COUNT = 5;
const EXPANDED_COUNT = 20;

export default function TrendingHashtags() {
  const [hashtags, setHashtags] = useState<TrendingHashtag[] | null>(null);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/trends?limit=${EXPANDED_COUNT}`)
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
      <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
        トレンドを取得できませんでした
      </p>
    );
  }

  if (!hashtags) {
    return (
      <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
        読み込み中...
      </p>
    );
  }

  if (hashtags.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Sparkles size={20} className="text-gray-300 dark:text-gray-600" />
        <p className="text-xs text-gray-400 dark:text-gray-500">準備中です</p>
      </div>
    );
  }

  const visibleHashtags = expanded ? hashtags : hashtags.slice(0, COLLAPSED_COUNT);
  const canExpand = hashtags.length > COLLAPSED_COUNT;

  return (
    <div>
      <ul>
        {visibleHashtags.map((item, index) => (
          <li key={item.tag}>
            <Link
              href={hashtagSearchHref(item.tag)}
              className="flex items-center gap-3 rounded-lg px-1.5 py-2 transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span
                className={`w-4 shrink-0 text-right text-sm font-bold ${
                  index < 3
                    ? "text-pink-600 dark:text-pink-400"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  #{item.tag}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {item.isFallback ? "注目ワード" : `${item.postCount.toLocaleString()}件の投稿`}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          {expanded ? (
            <>
              閉じる
              <ChevronUp size={14} />
            </>
          ) : (
            <>
              もっと見る
              <ChevronDown size={14} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
