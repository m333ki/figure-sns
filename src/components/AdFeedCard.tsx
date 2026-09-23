// Placeholder in-feed ad slot -- same card shell (rounding/border/shadow) as
// PostCard so it sits in the timeline without looking out of place. Swap
// the inner content for a real AdSense <ins>/<script> or ASP <iframe> tag
// when ready.
export default function AdFeedCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="relative flex h-48 w-full flex-col items-center justify-center gap-1 border-b border-dashed border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-500">
        <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white">
          PR
        </span>
        <span className="text-xs font-medium">広告スペース</span>
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-400 dark:text-gray-500">スポンサーリンク</p>
      </div>
    </div>
  );
}
