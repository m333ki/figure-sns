import type { NavBadgeKey } from "@/lib/nav-items";
import { useNotifications } from "@/context/NotificationsContext";

export function useNavBadgeCounts(): Partial<Record<NavBadgeKey, number>> {
  return useNotifications().counts;
}
