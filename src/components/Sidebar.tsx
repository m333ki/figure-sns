"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquarePen } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav-items";
import { useComposer } from "@/context/ComposerContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { open } = useComposer();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between px-3 py-4 lg:flex">
      <div>
        <Link
          href="/"
          className="mb-2 block rounded-full px-3 py-2 text-xl font-bold tracking-tight text-pink-600 transition hover:bg-gray-100 dark:text-pink-400 dark:hover:bg-gray-800"
        >
          FigStagram
        </Link>

        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3.5 rounded-full px-3 py-2.5 text-[15px] transition ${
                  active
                    ? "bg-gray-100 font-bold text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                    : "font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={open}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-pink-600 py-2.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-pink-700 hover:shadow"
      >
        <SquarePen size={17} />
        投稿する
      </button>
    </aside>
  );
}
