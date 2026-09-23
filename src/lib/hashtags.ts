// Matches "#" followed by anything up to the next whitespace or a small set
// of common delimiter punctuation (half- and full-width). Deliberately a
// "stop at delimiters" class rather than a positive Unicode word-character
// match, since Postgres/JS Unicode word classes don't reliably cover
// Japanese kanji/kana -- excluding delimiters works for any script.
const HASHTAG_SOURCE =
  '#([^\\s#.,!?;:、。・！？；：「」『』()（）\\[\\]【】"\'"\']+)';

export type TextSegment =
  | { type: "text"; value: string }
  | { type: "hashtag"; value: string };

// One post using the same tag twice should count once -- callers aggregate
// "how many posts used this tag", not raw occurrences.
export function extractHashtags(text: string): string[] {
  const re = new RegExp(HASHTAG_SOURCE, "gu");
  const tags = new Set<string>();
  for (const match of text.matchAll(re)) {
    tags.add(match[1]);
  }
  return [...tags];
}

export function splitHashtags(text: string): TextSegment[] {
  const re = new RegExp(HASHTAG_SOURCE, "gu");
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, index) });
    }
    segments.push({ type: "hashtag", value: match[1] });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }
  return segments;
}

// Strips a leading "#" (present when arriving from a trend/hashtag link)
// so callers can treat "#初音ミク" and "初音ミク" as the same search term.
export function normalizeSearchQuery(rawQuery: string): string {
  const trimmed = rawQuery.trim();
  return trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
}

export function hashtagSearchHref(tag: string): string {
  return `/search?q=${encodeURIComponent("#" + tag)}`;
}
