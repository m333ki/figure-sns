"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchIsAdmin } from "@/lib/admin";

type CheckedAdmin = { userId: string; isAdmin: boolean };

// Keyed to the current user (like OnboardingGate's `pending`) so a stale
// result from a previous session can never read as "admin" for whoever is
// logged in now, and so the "no user" case needs no synchronous setState in
// the effect below.
export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const [checked, setChecked] = useState<CheckedAdmin | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchIsAdmin(user.id)
      .then((admin) => {
        if (!cancelled) setChecked({ userId: user.id, isAdmin: admin });
      })
      .catch((e) => {
        console.error("Failed to check admin status:", e);
        if (!cancelled) setChecked({ userId: user.id, isAdmin: false });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const checkedForCurrentUser = !!user && checked?.userId === user.id;
  return {
    isAdmin: checkedForCurrentUser && checked.isAdmin,
    loading: authLoading || (!!user && !checkedForCurrentUser),
  };
}
