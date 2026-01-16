import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell, SmoothScroll, OverlayScrollbarsWrapper } from "@/components/layout";
import { QueryProvider } from "@/components/providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kotatsu Web - Manga Reader",
  description: "Baca manga online dari berbagai sumber Indonesia",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning untuk mengatasi browser extension (translator, dll)
    // yang mengubah DOM sebelum React hydrate
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <OverlayScrollbarsWrapper>
            <SmoothScroll />
            <Toaster
              position="bottom-center"
              toastOptions={{
                style: {
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                },
              }}
            />
            <AppShell>
              {children}
            </AppShell>
          </OverlayScrollbarsWrapper>
        </QueryProvider>
      </body>
    </html>
  );
}

