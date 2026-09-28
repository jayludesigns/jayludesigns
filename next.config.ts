import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    // Las fotos reales del panel vivirán en Supabase Storage; los SVG de
    // demostración van por <img> porque el optimizador no los necesita.
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    // Next 16 exige declarar las calidades que se usan en el markup.
    qualities: [70, 75, 80, 90],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        // El service worker nunca debe quedar cacheado por el navegador: si no,
        // los usuarios se quedan clavados en una versión vieja.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // El worker no puede tomar el control hasta que se recarga la pestaña.
        source: "/:path*sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
