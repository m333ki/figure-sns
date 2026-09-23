import Link from "next/link";
import AuthStatus from "@/components/AuthStatus";

export default function MobileHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden dark:border-gray-800 dark:bg-gray-950/95">
      <Link
        href="/"
        className="text-lg font-bold tracking-tight text-pink-600 dark:text-pink-400"
      >
        FigStagram
      </Link>
      <AuthStatus compact />
    </header>
  );
}
