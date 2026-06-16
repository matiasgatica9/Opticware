import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Supabase SSR session (patrón oficial) ─────────────────────────────
  // IMPORTANTE: supabaseResponse debe ser reasignado dentro de setAll
  // para que los server components reciban las cookies actualizadas.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 1. Actualizar el request (para que server components lo vean)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // 2. Recrear la response con el request actualizado
          supabaseResponse = NextResponse.next({ request })
          // 3. Propagar las cookies al browser en la response
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // NO agregar ninguna lógica entre createServerClient y getUser().
  // Esta llamada refresca la sesión y popula las cookies correctamente.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Protección de rutas ───────────────────────────────────────────────
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirigir a /dashboard si ya está autenticado e intenta ir a login/register
  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // ── Headers de seguridad ──────────────────────────────────────────────
  supabaseResponse.headers.set("X-Frame-Options", "DENY")
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff")
  supabaseResponse.headers.set("X-XSS-Protection", "1; mode=block")
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  supabaseResponse.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  )
  if (process.env.NODE_ENV === "production") {
    supabaseResponse.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    )
  }
  supabaseResponse.headers.delete("X-Powered-By")

  return supabaseResponse
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
