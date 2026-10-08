"use client";

import { useEffect } from "react";
import Script from "next/script";
import AffiliateLink from "@/components/AffiliateLink";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ADSENSE_SLOT_ID = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;
const AFFILIATE_BANNER_URL = process.env.NEXT_PUBLIC_AFFILIATE_BANNER_URL;
const AFFILIATE_BANNER_LABEL = process.env.NEXT_PUBLIC_AFFILIATE_BANNER_LABEL;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function AdSenseUnit({ clientId, slotId }: { clientId: string; slotId: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense push failed:", e);
    }
  }, []);

  return (
    <>
      {/* Shared `id` across every AdFeedCard instance -- next/script only
          ever injects the tag for the first one, so the script loads once
          regardless of how many ad slots are in the feed. */}
      <Script
        id="adsbygoogle-script"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </>
  );
}

// Placeholder in-feed ad slot. Swaps in a real unit once the matching env
// vars are configured:
// - NEXT_PUBLIC_ADSENSE_CLIENT_ID + NEXT_PUBLIC_ADSENSE_SLOT_ID -> AdSense
// - NEXT_PUBLIC_AFFILIATE_BANNER_URL (+ optional _LABEL) -> affiliate banner
// With neither set (local dev, or before either account exists), this keeps
// the original placeholder card so the feed's layout never breaks.
export default function AdFeedCard() {
  if (ADSENSE_CLIENT_ID && ADSENSE_SLOT_ID) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card p-3 shadow-sm">
        <AdSenseUnit clientId={ADSENSE_CLIENT_ID} slotId={ADSENSE_SLOT_ID} />
      </div>
    );
  }

  if (AFFILIATE_BANNER_URL) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card p-3 shadow-sm">
        <AffiliateLink url={AFFILIATE_BANNER_URL} label={AFFILIATE_BANNER_LABEL || "おすすめ商品をチェック"} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="relative flex h-48 w-full flex-col items-center justify-center gap-1 border-b border-dashed border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-500">
        <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white">
          PR
        </span>
        <span className="text-xs font-medium">広告スペース</span>
      </div>
      <div className="p-3">
        <p className="text-xs text-muted">スポンサーリンク</p>
      </div>
    </div>
  );
}
