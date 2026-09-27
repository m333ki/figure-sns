import RightSideAdBanner from "@/components/RightSideAdBanner";
import TrendingHashtags from "@/components/TrendingHashtags";

export default function RightRail() {
  return (
    <aside className="sticky top-0 hidden h-screen w-96 shrink-0 overflow-y-auto px-4 py-4 xl:block">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-1 text-base font-bold text-foreground">
          トレンド
        </h2>
        <TrendingHashtags />
      </div>

      <div className="sticky top-[80px] mt-4">
        <RightSideAdBanner />
      </div>
    </aside>
  );
}
