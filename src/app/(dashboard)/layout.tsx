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
          active: true,
        })
        .select("*, tenants(*)")
        .single()
      userData = newUser
    } else {
      userData = ud
    }
  } else {
    const authClient = await createAuthClient()
    const { data: { user: authUser } } = await authClient.auth.getUser()
    if (!authUser) redirect("/login")
    user = authUser

    const { data: ud } = await supabase
      .from("users")
      .select("*, tenants(*)")
      .eq("id", user.id)
      .single()

    userData = ud
  }

  if (!userData || !userData.tenants) {
    // Auth user exists but no DB record / tenant — sign out to break any loop
    const authClient = await createAuthClient()
    await authClient.auth.signOut()
    redirect("/login?error=no_profile")
  }

  const tenant = userData.tenants as {
    id: string
    business_name: string
    logo_url: string | null
    primary_color: string
  }

  const fullName: string = userData.full_name ?? "Usuario"
  const initials =
    fullName
      .split(" ")
      .map((n: string) => n[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        businessName={tenant.business_name}
        logoUrl={tenant.logo_url}
        primaryColor={tenant.primary_color}
        userInitials={initials}
        userName={fullName}
        userRole={userData.role}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar userName={fullName} />
        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  )
}
