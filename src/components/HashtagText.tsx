import Link from "next/link";
import { splitHashtags, hashtagSearchHref } from "@/lib/hashtags";

// Renders caption/body text with any "#tag" segments turned into links back
// to the search results page for that tag, so tapping a hashtag anywhere a
// post appears re-runs the same search.
export default function HashtagText({ text }: { text: string }) {
  const segments = splitHashtags(text);

  return (
    <>
      {segments.map((segment, index) =>
        segment.type === "hashtag" ? (
          <Link
            key={index}
            href={hashtagSearchHref(segment.value)}
            onClick={(e) => e.stopPropagation()}
            className="text-pink-600 hover:underline dark:text-pink-400"
          >
            #{segment.value}
          </Link>
        ) : (
          <span key={index}>{segment.value}</span>
        )
      )}
    </>
  );
}
