import { ExternalLink } from "lucide-react";

// Only ever renders for an http(s) URL -- guards against a stray
// `javascript:`/`data:` value ever reaching an href (e.g. if a future admin
// tool lets this be set without going through isValidAffiliateUrl first).
function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidAffiliateUrl(value: string): boolean {
  return isSafeHttpUrl(value);
}

export default function AffiliateLink({
  url,
  label = "商品を見る",
}: {
  url: string;
  label?: string;
}) {
  if (!isSafeHttpUrl(url)) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition hover:border-accent"
    >
      <span className="flex items-center gap-2 text-foreground">
        <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white">
          PR
        </span>
        {label}
      </span>
      <ExternalLink size={14} className="shrink-0 text-muted" />
    </a>
  );
}
