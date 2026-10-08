"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchProfile } from "@/lib/profiles";
import OnboardingModal from "@/components/OnboardingModal";

type PendingOnboarding = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

export default function OnboardingGate() {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingOnboarding | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const metaName =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email?.split("@")[0] ||
      "";
    const metaAvatar =
      (user.user_metadata?.avatar_url as string | undefined) ||
      (user.user_metadata?.picture as string | undefined) ||
      null;

    fetchProfile(user.id)
      .then((profile) => {
        if (cancelled) return;
        if (!profile) {
          // No row yet (shouldn't normally happen once the handle_new_user
          // trigger is installed) -- fall back to the auth metadata Google
          // gave us so onboarding still has something to prefill.
          setPending({ userId: user.id, displayName: metaName, avatarUrl: metaAvatar });
        } else if (!profile.usernameSet) {
          setPending({
            userId: user.id,
            displayName: profile.displayName || metaName,
            avatarUrl: profile.avatarUrl ?? metaAvatar,
          });
        }
      })
      .catch((e) => console.error("Failed to check onboarding status:", e));

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Keyed to the current user so a stale `pending` from a previous session
  // (logged out, or switched accounts) can never flash the modal before its
  // own fetch above has a chance to resolve.
  if (!user || !pending || pending.userId !== user.id) return null;

  return (
    <OnboardingModal
      userId={user.id}
      initialDisplayName={pending.displayName}
      initialAvatarUrl={pending.avatarUrl}
      onComplete={() => setPending(null)}
    />
  );
}
