import { Bell, Bookmark, Home, MessageCircle, Search, User } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/explore", label: "探索", icon: Search },
  { href: "/notifications", label: "通知", icon: Bell },
  { href: "/chat", label: "チャット", icon: MessageCircle },
  { href: "/saved", label: "保存済み", icon: Bookmark },
  { href: "/mypage", label: "プロフィール", icon: User },
] as const;

export const MOBILE_NAV_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[3],
  NAV_ITEMS[5],
] as const;
