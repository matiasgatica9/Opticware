import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// Rutas que requieren sesión activa
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/patients",
  "/stock",
  "/sales",
  "/agenda",
  "/invoicing",
  "/settings",
  "/reports",
  "/suppliers",
  "/obras-sociales",
]

// Rutas de autenticación (límite más estricto contra fuerza bruta)
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getClientIp(request.headers)

  // ── Rate limiting ─────────────────────────────────────────────────────
  // 5 req/min en auth (anti fuerza bruta), 120 req/min en el resto de la API
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p))
  const isApiPath = pathname.startsWith("/api/")

  if (isAuthPath || isApiPath) {
    const limit = isAuthPath ? 5 : 120
    const allowed = rateLimit(`${ip}:${pathname}`, limit, 60_000)

    if (!allowed) {
      const body = isApiPath
        ? JSON.stringify({ error: "Demasiadas solicitudes. Intentá en 1 minuto." })
        : null

      return new NextResponse(body, {
        status: 429,
        headers: {
          "Content-Type": isApiPath ? "application/json" : "text/plain",
          "Retry-After": "60",
          "X-RateLimit-Limit": String(limit),
        },
      })
    }
  }

  // ── Preparar response con headers de seguridad ────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Actualiza las cookies en el request para que server components las vean
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        },
      },
    }
  )

  // Refrescar la sesión (importante para tokens próximos a vencer)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Protección de rutas ───────────────────────────────────────────────
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const devBypass = process.env.DEV_BYPASS_AUTH === "true"

  if (isProtected && !user && !devBypass) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirigir a /dashboard si ya está autenticado e intenta ir a login/register
  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // ── Construir response final con headers de seguridad ─────────────────
  const response = NextResponse.next({ request })

  // Propagar cookies de sesión actualizadas
  const { cookies: resCookies } = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  ).auth.getUser().then(() => response.cookies)

  // Seguridad HTTP
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  )
  // HSTS: solo en producción (HTTPS)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    )
  }
  // Ocultar que usa Next.js
  response.headers.delete("X-Powered-By")

  return response
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - archivos de imagen (.svg, .png, .jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
