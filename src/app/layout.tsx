import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/components/AppShell";
import { PostsProvider } from "@/context/PostsContext";
import { ComposerProvider } from "@/context/ComposerContext";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FigStagram | フィギュア専用SNS",
  description: "フィギュアコレクターのための投稿・共有SNS",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950">
        <AuthProvider>
          <NotificationsProvider>
            <PostsProvider>
              <ComposerProvider>
                <AppShell>{children}</AppShell>
              </ComposerProvider>
            </PostsProvider>
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
