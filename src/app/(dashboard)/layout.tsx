import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const devBypass = process.env.DEV_BYPASS_AUTH === "true"

  let userData: any = null

  if (devBypass) {
    // Demo mode: anon RLS policies allow reading dev tenant data without auth
    const { data } = await supabase
      .from("users")
      .select("*, tenants(*)")
      .limit(1)
      .single()
    userData = data
  } else {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data } = await supabase
      .from("users")
      .select("*, tenants(*)")
      .eq("id", user.id)
      .single()

    userData = data
    if (!userData) redirect("/login")
  }

  if (!userData) redirect("/login")

  const tenant = userData.tenants as {
    id: string
    business_name: string
    logo_url: string | null
    primary_color: string
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        businessName={tenant.business_name}
        logoUrl={tenant.logo_url}
        primaryColor={tenant.primary_color}
        userInitials={userData.full_name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)}
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
