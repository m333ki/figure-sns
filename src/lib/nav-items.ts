import { Bell, Bookmark, Home, MessageCircle, Search, User } from "lucide-react";

export type NavBadgeKey = "notifications" | "chat";

export const NAV_ITEMS = [
  { href: "/", label: "ホーム", icon: Home, badgeKey: undefined },
  { href: "/search", label: "検索", icon: Search, badgeKey: undefined },
  { href: "/notifications", label: "通知", icon: Bell, badgeKey: "notifications" as const },
  { href: "/chat", label: "チャット", icon: MessageCircle, badgeKey: "chat" as const },
  { href: "/saved", label: "保存済み", icon: Bookmark, badgeKey: undefined },
  { href: "/mypage", label: "プロフィール", icon: User, badgeKey: undefined },
] as const satisfies { href: string; label: string; icon: unknown; badgeKey: NavBadgeKey | undefined }[];

export const MOBILE_NAV_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[3],
  NAV_ITEMS[5],
] as const;
