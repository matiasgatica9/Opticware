import { createAuthClient } from "@/lib/supabase/server"

/**
 * Returns the tenant_id for the current server-side session.
 * Always reads the user from cookies (auth client), then queries the DB
 * using the provided supabase client (may be service role for RLS bypass).
 */
export async function getTenantId(supabase: any): Promise<string | null> {
  if (process.env.NODE_ENV === "development" && (process.env.DEV_BYPASS_AUTH === "true" || process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true")) {
    return process.env.DEV_TENANT_ID || process.env.NEXT_PUBLIC_DEV_TENANT_ID || null
  }

  // The service-role client has no JWT — always use the cookie-based
  // auth client to resolve who is logged in.
  const authClient = await createAuthClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single()

  return data?.tenant_id ?? null
}
