"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchUnreadNotificationCount } from "@/lib/notifications";
import { fetchUnreadMessageCount } from "@/lib/messages";
import { useAuth } from "@/context/AuthContext";

type NotificationCounts = { notifications?: number; chat?: number };

type NotificationsContextValue = {
  counts: NotificationCounts;
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>({});

  const refresh = useCallback(async () => {
    if (!user) {
      setCounts({});
      return;
    }
    // Right after a fresh signup/login, this fires alongside several other
    // first-load requests (profile, posts, ...) on a session that just came
    // alive -- occasionally one of them (often a HEAD/count request, which
    // carries no response body to explain *why*) gets a transient failure
    // from that burst. One retry clears it without ever touching the user;
    // only a failure that survives the retry is worth logging.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const [notifications, chat] = await Promise.all([
          fetchUnreadNotificationCount(),
          fetchUnreadMessageCount(),
        ]);
        setCounts({ notifications: notifications || undefined, chat: chat || undefined });
        return;
      } catch (e) {
        if (attempt === 2) {
          // Logged in full regardless of shape -- a bare console.error(..., e)
          // can print as an empty/unhelpful object for some error types (e.g.
          // a PostgrestError whose fields aren't own-enumerable), which made a
          // real failure here indistinguishable from a transient one.
          console.error(
            "failed to refresh notification counts",
            e instanceof Error ? e.message : JSON.stringify(e)
          );
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
    // Depend on user?.id (not `user`): supabase-js hands AuthContext a new
    // session/user object on every auth event, including background token
    // refreshes and the duplicate initial getSession()/onAuthStateChange
    // firing on mount -- none of which change who's actually logged in.
    // Depending on the object itself re-ran this (and every page effect
    // that did the same) on each of those, which is what made chat/
    // notifications/profile feel slow or stuck re-loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    // ログイン状態が変わるたびに未読数を取り直す。マウント時fetchと同じ、
    // 構造的に回避不可能なsetState-in-effectパターン（PostsContext参照）。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return (
    <NotificationsContext.Provider value={{ counts, refresh }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
}
