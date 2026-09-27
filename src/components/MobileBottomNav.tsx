"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquarePen } from "lucide-react";
import { MOBILE_NAV_ITEMS, isChatThreadRoute } from "@/lib/nav-items";
import { useNavBadgeCounts } from "@/lib/navBadges";
import { useScrollToTopAndRefresh } from "@/lib/useScrollToTopAndRefresh";
import { useComposer } from "@/context/ComposerContext";
import { useAuth } from "@/context/AuthContext";
import NavBadge from "@/components/NavBadge";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { open } = useComposer();
  const { user, promptLogin } = useAuth();
  const badgeCounts = useNavBadgeCounts();
  const handleHomePress = useScrollToTopAndRefresh();

  if (isChatThreadRoute(pathname)) return null;

  return (
    <>
      {pathname === "/" && (
        <button
          type="button"
          onClick={user ? open : promptLogin}
          aria-label="投稿する"
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition hover:opacity-90 lg:hidden"
        >
          <SquarePen size={22} />
        </button>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="モバイルナビゲーション"
      >
        {MOBILE_NAV_ITEMS.map(({ href, label, icon: Icon, badgeKey }) => {
          const active = pathname === href;
          const count = badgeKey ? badgeCounts[badgeKey] : undefined;
          const isHomeItem = href === "/";
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={
                isHomeItem && active
                  ? (e) => {
                      e.preventDefault();
                      handleHomePress();
                    }
                  : undefined
              }
              className="flex flex-1 touch-manipulation flex-col items-center gap-0.5 py-2 active:opacity-70"
            >
              <span className="relative">
                <Icon
                  size={21}
                  strokeWidth={active ? 2.5 : 2}
                  className={active ? "text-accent" : "text-muted"}
                />
                {!!count && <NavBadge count={count} />}
              </span>
              <span
                className={`text-[10px] leading-none ${
                  active ? "font-semibold text-accent" : "text-muted"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
