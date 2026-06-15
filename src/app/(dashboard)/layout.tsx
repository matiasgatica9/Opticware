import { redirect } from "next/navigation"
import { createClient, createAuthClient } from "@/lib/supabase/server"
import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user: any = null
  let userData: any = null
  const supabase = await createClient()

  if (process.env.DEV_BYPASS_AUTH === "true") {
    user = { id: process.env.DEV_USER_ID }
    const { data: ud } = await supabase
      .from("users")
      .select("*, tenants(*)")
      .eq("id", user.id)
      .single()
    
    if (!ud) {
      // Create user if bypass is on but it's not in db yet
      const { data: tenant } = await supabase.from("tenants").select("*").limit(1).single()
      const tenantId = tenant?.id || process.env.DEV_TENANT_ID
      const { data: newUser } = await supabase
        .from("users")
        .insert({
          id: user.id,
          tenant_id: tenantId,
          email: "dev@example.com",
          full_name: "Usuario Dev Bypass",
          role: "admin",
          active: true
        })
        .select("*, tenants(*)")
        .single()
      userData = newUser
    } else {
      userData = ud
    }
  } else {
    // Verify session via cookie-based auth client (service role has no JWT)
    const authClient = await createAuthClient()
    const { data: { user: authUser } } = await authClient.auth.getUser()
    if (!authUser) redirect("/login")
    user = authUser

    // Fetch user + tenant data using service role (or anon+cookies)
    const { data: ud } = await supabase
      .from("users")
      .select("*, tenants(*)")
      .eq("id", user.id)
      .single()
    
    userData = ud
  }

  if (!userData) redirect("/login")

  const tenant = userData.tenants as {
    id: string
    business_name: string
    logo_url: string | null
    primary_color: string
  }

  const initials = (userData.full_name as string)
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        businessName={tenant.business_name}
        logoUrl={tenant.logo_url}
        primaryColor={tenant.primary_color}
        userInitials={initials}
        userName={userData.full_name}
        userRole={userData.role}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar userName={userData.full_name} />
        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  )
}
