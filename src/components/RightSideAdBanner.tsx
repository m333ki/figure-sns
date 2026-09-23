export default function RightSideAdBanner() {
  return (
    <div className="mx-auto w-full max-w-[300px] rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/60">
      <p className="mb-2 text-center text-[11px] font-medium tracking-wide text-gray-400 dark:text-gray-500">
        スポンサーリンク
      </p>
      {/* Placeholder slot -- swap for a real AdSense <ins>/<script> or ASP
          <iframe> tag when ready. Width fits a standard 300x250 rectangle
          as shown below; a 300x600 half-page unit also fits this width,
          just change h-[250px] to h-[600px]. */}
      <div className="flex h-[250px] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500">
        <span className="text-xs font-bold tracking-wide">PR</span>
        <span className="text-[11px]">広告スペース</span>
        <span className="text-[10px] text-gray-300 dark:text-gray-600">300 × 250</span>
      </div>
    </div>
  );
}
