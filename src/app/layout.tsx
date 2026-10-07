import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import AppShell from "@/components/AppShell";
import { PostsProvider } from "@/context/PostsContext";
import { ComposerProvider } from "@/context/ComposerContext";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { ToastProvider } from "@/context/ToastContext";
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FigStagram",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#0F0F12",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          storageKey="figstagram-theme"
        >
          <ToastProvider>
            <AuthProvider>
              <NotificationsProvider>
                <PostsProvider>
                  <ComposerProvider>
                    <AppShell>{children}</AppShell>
                  </ComposerProvider>
                </PostsProvider>
              </NotificationsProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
