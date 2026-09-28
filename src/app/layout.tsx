import type { Metadata, Viewport } from "next";
import { Anton, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { getStoreSettings } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { Providers } from "@/components/providers";
import "./globals.css";

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-jb",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light",
};

export async function generateMetadata(): Promise<Metadata> {
  const [settings, siteUrl] = await Promise.all([getStoreSettings(), getSiteUrl()]);
  const title = {
    default: `${settings.store_name} · ${settings.tagline}`,
    template: `%s · ${settings.store_name}`,
  };
  return {
    metadataBase: new URL(siteUrl),
    title,
    description: settings.description,
    applicationName: settings.store_name,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: settings.store_name,
    },
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    },
    formatDetection: { telephone: false },
    openGraph: {
      type: "website",
      locale: "es_VE",
      siteName: settings.store_name,
      title,
      description: settings.description,
      url: siteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: settings.description,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();

  return (
    <html
      lang="es-VE"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${grotesk.variable} ${mono.variable}`}
    >
      <body className="min-h-dvh bg-paper text-ink antialiased">
        <Providers
          rate={settings.bcv_rate}
          source={settings.bcv_source}
          updatedAt={settings.bcv_updated_at}
          stale={settings.bcv_stale}
        >
          {/*
            Cabecera y pie viven en el layout de (site) y no aquí: el panel de
            administración lleva su propia carcasa, sin barra de la tienda.
          */}
          <a
            href="#contenido"
            className="sr-only-focusable fixed left-4 top-4 z-100 border border-ink bg-paper px-4 py-2 text-xs font-bold uppercase tracking-widest"
          >
            Saltar al contenido
          </a>
          {children}
        </Providers>
      </body>
    </html>
  );
}
