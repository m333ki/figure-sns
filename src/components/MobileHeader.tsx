"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import AuthStatus from "@/components/AuthStatus";
import NavBadge from "@/components/NavBadge";
import { useNavBadgeCounts } from "@/lib/navBadges";

export default function MobileHeader() {
  const pathname = usePathname();
  const badgeCounts = useNavBadgeCounts();
  if (pathname !== "/") return null;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
      <Link
        href="/"
        className="text-lg font-bold tracking-tight text-accent"
      >
        Figgy
      </Link>
      <div className="flex items-center gap-1">
        <Link
          href="/notifications"
          aria-label="通知"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Bell size={20} />
          {!!badgeCounts.notifications && <NavBadge count={badgeCounts.notifications} />}
        </Link>
        <AuthStatus compact />
      </div>
    </header>
  );
}
