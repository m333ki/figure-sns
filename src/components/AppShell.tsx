"use client";

import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import RightRail from "@/components/RightRail";
import MobileHeader from "@/components/MobileHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import PostComposerModal from "@/components/PostComposerModal";
import { useComposer } from "@/context/ComposerContext";

export default function AppShell({ children }: { children: ReactNode }) {
  const { isOpen, close } = useComposer();

  return (
    <div className="mx-auto flex w-full max-w-7xl">
      <Sidebar />

      <div className="flex min-h-screen w-full flex-1 flex-col border-gray-200 bg-white pb-16 lg:max-w-3xl lg:border-x lg:pb-0 dark:border-gray-800 dark:bg-gray-950">
        <MobileHeader />
        <main className="flex-1">{children}</main>
      </div>

      <RightRail />
      <MobileBottomNav />

      {isOpen && <PostComposerModal onClose={close} />}
    </div>
  );
}
