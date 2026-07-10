import type { Metadata, Viewport } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { UniversalContextProvider } from "@/lib/context/universal-context";

export const metadata: Metadata = {
  title: "San OS — Personal Engine",
  description: "A premium personal operating system for ambitious people.",
  applicationName: "San OS",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "San OS",
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
          </UniversalContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
