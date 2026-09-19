"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquarePen } from "lucide-react";
import { MOBILE_NAV_ITEMS } from "@/lib/nav-items";
import { useComposer } from "@/context/ComposerContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { open } = useComposer();

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="投稿する"
        className="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-pink-600 text-white shadow-lg transition hover:bg-pink-700 lg:hidden"
      >
        <SquarePen size={22} />
      </button>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden dark:border-gray-800 dark:bg-gray-950/95">
        {MOBILE_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5"
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
                className={
                  active
                    ? "text-pink-600 dark:text-pink-400"
                    : "text-gray-500 dark:text-gray-400"
                }
              />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
