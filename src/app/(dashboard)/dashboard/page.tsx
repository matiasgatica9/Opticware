import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/lib/get-tenant"
import { formatCurrency } from "@/lib/utils"
import { Users, Calendar, ShoppingCart, AlertTriangle } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) return null

  const [patientsRes, appointmentsRes, salesRes, stockRes] = await Promise.all([
    supabase.from("patients").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("active", true),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "pendiente"),
    supabase.from("sales").select("total").eq("tenant_id", tenantId).gte("created_at", new Date(new Date().setHours(0,0,0,0)).toISOString()),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("active", true).filter("stock", "lte", "stock_min"),
  ])

  const totalPatients = patientsRes.count ?? 0
  const pendingAppointments = appointmentsRes.count ?? 0
  const todaySales = salesRes.data?.reduce((sum, s) => sum + s.total, 0) ?? 0
  const lowStockCount = stockRes.count ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen del día</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={18} className="text-blue-600" />}
          iconBg="bg-blue-50"
          label="Pacientes activos"
          value={totalPatients.toLocaleString("es-AR")}
        />
        <StatCard
          icon={<Calendar size={18} className="text-violet-600" />}
          iconBg="bg-violet-50"
          label="Turnos pendientes"
          value={pendingAppointments.toString()}
        />
        <StatCard
          icon={<ShoppingCart size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="Ventas hoy"
          value={formatCurrency(todaySales)}
        />
        <StatCard
          icon={<AlertTriangle size={18} className="text-amber-600" />}
          iconBg="bg-amber-50"
          label="Stock bajo"
          value={lowStockCount.toString()}
          alert={lowStockCount > 0}
        />
      </div>

      {/* Recent activity placeholder */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Próximos turnos</h2>
          <p className="text-sm text-gray-400">No hay turnos programados para hoy.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Últimas ventas</h2>
          <p className="text-sm text-gray-400">No hay ventas registradas hoy.</p>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  alert,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  alert?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
      <div className={`${iconBg} p-2 rounded-lg`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-xl font-semibold mt-0.5 ${alert ? "text-amber-600" : "text-gray-900"}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
