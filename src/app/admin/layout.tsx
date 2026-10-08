"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/lib/useIsAdmin";

// Framework for every /admin/* route: gates access to admins only (checked
// via profiles.is_admin -- see fetchIsAdmin in lib/admin.ts) and bounces
// anyone else back to the top page, so individual admin pages don't each
// need to repeat this check.
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/");
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return <p className="py-24 text-center text-sm text-muted">読み込み中...</p>;
  }

  return <>{children}</>;
}
