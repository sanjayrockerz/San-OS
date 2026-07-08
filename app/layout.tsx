import type { Metadata, Viewport } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { UniversalContextProvider } from "@/lib/context/universal-context";
import { CommandPalette } from "@/components/ui/command-palette";

export const metadata: Metadata = {
  title: "SanOS — Personal Engine",
  description: "A premium personal operating system.",
  applicationName: "SanOS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SanOS",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-dvh">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <UniversalContextProvider>
            {children}
            <CommandPalette />
          </UniversalContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
