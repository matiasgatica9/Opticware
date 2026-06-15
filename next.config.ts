import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // ── Build ────────────────────────────────────────────────────────────
  // NOTA: ignoreBuildErrors: true oculta errores reales de TypeScript.
  // Mantenerlo en true solo mientras se migra; removerlo cuando todos los
  // tipos estén correctos para que el CI falle ante errores de tipo.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ── Seguridad ────────────────────────────────────────────────────────
  // Elimina el header "X-Powered-By: Next.js" que revela el stack
  poweredByHeader: false,

  // ── Imágenes ─────────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    // Dominios permitidos para imágenes externas (logos de tenants, etc.)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lsnwmgmpeujclvzbizre.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // ── Performance ──────────────────────────────────────────────────────
  compress: true,

  experimental: {
    // Tree-shaking optimizado para íconos de lucide-react (evita importar todo el paquete)
    optimizePackageImports: ["lucide-react"],
  },

  // ── Headers HTTP de seguridad ────────────────────────────────────────
  // Complementa los headers del middleware (el middleware los aplica dinámicamente,
  // estos se aplican a nivel de CDN/Edge para respuestas estáticas también).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Impide que la app se incruste en un iframe (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Impide que el navegador "adivine" el tipo de contenido (MIME sniffing)
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Filtro XSS legacy (navegadores viejos)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // No mandar el header Referer completo a sitios externos
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Deshabilitar APIs del navegador que no usa la app
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
      {
        // Cache agresivo para assets estáticos (tienen hash en el nombre)
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
}

export default nextConfig
