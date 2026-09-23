"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquarePen } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav-items";
import { useNavBadgeCounts } from "@/lib/navBadges";
import { useScrollToTopAndRefresh } from "@/lib/useScrollToTopAndRefresh";
import { useComposer } from "@/context/ComposerContext";
import { useAuth } from "@/context/AuthContext";
import AuthStatus from "@/components/AuthStatus";
import NavBadge from "@/components/NavBadge";

export default function Sidebar() {
  const pathname = usePathname();
  const { open } = useComposer();
  const { user, promptLogin } = useAuth();
  const badgeCounts = useNavBadgeCounts();
  const handleHomePress = useScrollToTopAndRefresh();

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
          {NAV_ITEMS.map(({ href, label, icon: Icon, badgeKey }) => {
            const active = pathname === href;
            const count = badgeKey ? badgeCounts[badgeKey] : undefined;
            const isHomeItem = href === "/";
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={
                  isHomeItem && active
                    ? (e) => {
                        e.preventDefault();
                        handleHomePress();
                      }
                    : undefined
                }
                className={`flex items-center gap-3.5 rounded-full px-3 py-2.5 text-[15px] transition ${
                  active
                    ? "bg-gray-100 font-bold text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                    : "font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                  {!!count && <NavBadge count={count} />}
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        <AuthStatus />
        <button
          type="button"
          onClick={user ? open : promptLogin}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-pink-600 py-2.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-pink-700 hover:shadow"
        >
          <SquarePen size={17} />
          投稿する
        </button>
      </div>
    </aside>
  );
}
