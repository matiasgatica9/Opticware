import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

const DEV_USER_ID = process.env.DEV_USER_ID ?? ""

function mockGetUser() {
  return async () => ({
    data: {
      user: {
        id: DEV_USER_ID,
        email: "dev@opticware.local",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as any,
    },
    error: null,
  })
}

export async function createClient() {
  if (process.env.DEV_BYPASS_AUTH === "true") {
    // Opción A: service_role_key disponible → bypassa RLS completamente
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createSupabaseClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      admin.auth.getUser = mockGetUser()
      return admin
    }

    // Opción B: sin service_role_key → usa anon key + políticas RLS dev
    // (requiere haber ejecutado la migración dev_rls_bypass en Supabase)
    const cookieStore = await cookies()
    const client = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch { }
          },
        },
      }
    )
    client.auth.getUser = mockGetUser()
    return client
  }

  // Producción — cliente normal con cookie auth
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { }
        },
      },
    }
  )
}
