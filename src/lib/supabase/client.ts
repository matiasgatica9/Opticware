import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

export function createClient() {
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // En dev bypass, mockea getUser para que los client components
  // puedan obtener el user/tenant sin sesión real
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    const devUserId = process.env.NEXT_PUBLIC_DEV_USER_ID ?? ""
    client.auth.getUser = async () => ({
      data: {
        user: {
          id: devUserId,
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

  return client
}
