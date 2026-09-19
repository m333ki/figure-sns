import { Sparkles } from "lucide-react";

export default function RightRail() {
  return (
    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 px-4 py-4 xl:block">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-gray-100">
          トレンド
        </h2>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Sparkles size={20} className="text-gray-300 dark:text-gray-600" />
          <p className="text-xs text-gray-400 dark:text-gray-500">準備中です</p>
        </div>
      </div>
    </aside>
  );
}
