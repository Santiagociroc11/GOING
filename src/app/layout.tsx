import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/PwaRegister";
import { NavProgress } from "@/components/NavProgress";

// System fonts: no network fetch during build (ideal for Docker/CI)
const fontVariables = {
  "--font-geist-sans":
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  "--font-geist-mono":
    'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Monaco, "Courier New", monospace',
};

const APP_NAME = "Going";
const APP_TITLE = "Going - B2B Delivery";
const APP_DESCRIPTION = "Plataforma de entregas B2B";

export const metadata: Metadata = {
    applicationName: APP_NAME,
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: APP_NAME,
    },
    formatDetection: { telephone: false },
    openGraph: {
        type: "website",
        siteName: APP_NAME,
        title: APP_TITLE,
        description: APP_DESCRIPTION,
    },
    twitter: {
        card: "summary",
        title: APP_TITLE,
        description: APP_DESCRIPTION,
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: "#ea580c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="apple-touch-startup-image"
          href="/splash/1284x2778"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/1170x2532"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/1125x2436"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/1242x2688"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"
        />
      </head>
      <body
        className="antialiased"
        style={fontVariables as React.CSSProperties}
      >
        <AuthProvider>
          <NavProgress />
          {children}
          <Toaster />
          <PwaRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
