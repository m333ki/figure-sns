"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import RightRail from "@/components/RightRail";
import MobileHeader from "@/components/MobileHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import PostComposerModal from "@/components/PostComposerModal";
import AuthModal from "@/components/AuthModal";
import { useComposer } from "@/context/ComposerContext";
import { isChatThreadRoute } from "@/lib/nav-items";

export default function AppShell({ children }: { children: ReactNode }) {
  const { isOpen, close } = useComposer();
  const pathname = usePathname();
  const chatThread = isChatThreadRoute(pathname);
  // No bottom nav on a chat thread (see MobileBottomNav) -- don't reserve
  // space for it there either, or the thread's own fixed-height layout ends
  // up with a dead gap where the nav used to be.
  const reserveNavSpace = !chatThread;

  return (
    <div className="mx-auto flex w-full max-w-7xl">
      <Sidebar />

      <div
        className={`flex w-full flex-1 flex-col border-gray-200 bg-white lg:max-w-3xl lg:border-x lg:pb-0 dark:border-gray-800 dark:bg-gray-950 ${
          chatThread ? "h-[100dvh]" : "min-h-screen"
        } ${reserveNavSpace ? "pb-[calc(3.5rem+env(safe-area-inset-bottom))]" : ""}`}
      >
        <MobileHeader />
        <main className="flex-1">{children}</main>
      </div>

      <RightRail />
      <MobileBottomNav />

      {isOpen && <PostComposerModal onClose={close} />}
      <AuthModal />
    </div>
  );
}
