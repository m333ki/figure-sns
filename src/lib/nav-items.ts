import { Bell, Bookmark, Flame, Home, MessageCircle, Search, User } from "lucide-react";

export type NavBadgeKey = "notifications" | "chat";

export const NAV_ITEMS = [
  { href: "/", label: "ホーム", icon: Home, badgeKey: undefined },
  { href: "/search", label: "検索", icon: Search, badgeKey: undefined },
  { href: "/notifications", label: "通知", icon: Bell, badgeKey: "notifications" as const },
  { href: "/chat", label: "チャット", icon: MessageCircle, badgeKey: "chat" as const },
  { href: "/saved", label: "保存済み", icon: Bookmark, badgeKey: undefined },
  { href: "/mypage", label: "プロフィール", icon: User, badgeKey: undefined },
] as const satisfies { href: string; label: string; icon: unknown; badgeKey: NavBadgeKey | undefined }[];

// Mobile swaps out 通知 for トレンド (通知 moves up into MobileHeader instead,
// next to the account icon) -- kept as its own list rather than derived from
// NAV_ITEMS indices since desktop's Sidebar still wants 通知 in its list.
const TRENDING_ITEM = {
  href: "/trending",
  label: "トレンド",
  icon: Flame,
  badgeKey: undefined,
} as const satisfies { href: string; label: string; icon: unknown; badgeKey: NavBadgeKey | undefined };

export const MOBILE_NAV_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  TRENDING_ITEM,
  NAV_ITEMS[3],
  NAV_ITEMS[5],
] as const;

// The chat thread view (not the `/chat` list) hides the bottom nav so the
// keyboard + message composer get the full width of the screen instead of
// competing with it for space. Shared between MobileBottomNav (which decides
// whether to render itself) and AppShell (which reserves layout space for
// it) so the two can't drift out of sync.
export function isChatThreadRoute(pathname: string): boolean {
  return pathname.startsWith("/chat/");
}
