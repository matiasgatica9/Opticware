import { type NextRequest, NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

// En vez de verificar el OTP directamente (lo que permite que
// escáneres de email consuman el token), redirigimos a una página
// con un botón que el usuario debe clickear manualmente.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/dashboard"

  if (token_hash && type) {
    // Redirigir a la página de confirmación con los params
    const params = new URLSearchParams({ token_hash, type, next })
    return NextResponse.redirect(new URL(`/auth/verify?${params}`, origin))
  }

  return NextResponse.redirect(new URL("/login?error=link_invalido", origin))
}
