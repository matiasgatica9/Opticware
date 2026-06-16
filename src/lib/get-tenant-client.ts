import { createClient } from "@/lib/supabase/client"

/**
 * Returns the tenant_id for the current browser session.
 * Uses the anon client + real user JWT from cookies.
 */
export async function getTenantIdClient(): Promise<string | null> {
  if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    return process.env.NEXT_PUBLIC_DEV_TENANT_ID || null
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single()

  return data?.tenant_id ?? null
}
