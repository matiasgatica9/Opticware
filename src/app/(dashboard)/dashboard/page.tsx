import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/lib/get-tenant"
import { formatCurrency } from "@/lib/utils"
import { Users, Calendar, ShoppingCart, AlertTriangle, Clock } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) return null

  // Inicio del día en Argentina (UTC-3)
  const now = new Date()
  const todayStart = new Date(now.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }) + "T00:00:00-03:00")

  const in7Days = new Date(todayStart)
  in7Days.setDate(in7Days.getDate() + 7)

  const [patientsRes, appointmentsCountRes, salesRes, stockRes, upcomingRes, recentSalesRes] =
    await Promise.all([
      // Total pacientes activos
      supabase
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("active", true),

      // Turnos pendientes totales
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "pendiente"),

      // Ventas de hoy (monto)
      supabase
        .from("sales")
        .select("total")
        .eq("tenant_id", tenantId)
        .gte("created_at", todayStart.toISOString()),

      // Stock bajo (comparamos dos columnas en JS)
      supabase
        .from("products")
        .select("id, stock, stock_min")
        .eq("tenant_id", tenantId)
        .eq("active", true),

      // Próximos turnos (hoy + 7 días)
      supabase
        .from("appointments")
        .select("id, scheduled_at, type, status, patients(first_name, last_name)")
        .eq("tenant_id", tenantId)
        .neq("status", "cancelado")
        .gte("scheduled_at", new Date().toISOString())
        .lte("scheduled_at", in7Days.toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5),

      // Últimas ventas de hoy
      supabase
        .from("sales")
        .select("id, total, payment_method, created_at, patients(first_name, last_name)")
        .eq("tenant_id", tenantId)
        .gte("created_at", todayStart.toISOString())
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  const totalPatients      = patientsRes.count ?? 0
  const pendingAppointments = appointmentsCountRes.count ?? 0
  const todaySales         = salesRes.data?.reduce((sum, s) => sum + (s.total ?? 0), 0) ?? 0
  const lowStockCount      = (stockRes.data ?? []).filter(p => p.stock <= p.stock_min).length
  const upcomingAppts      = upcomingRes.data ?? []
  const recentSales        = recentSalesRes.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen del día</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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

      {/* Próximos turnos + Últimas ventas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Próximos turnos */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Próximos turnos</h2>
            <Link href="/agenda" className="text-xs text-emerald-700 hover:underline">Ver agenda</Link>
          </div>

          {upcomingAppts.length === 0 ? (
            <p className="text-sm text-gray-400">No hay turnos programados próximamente.</p>
          ) : (
            <div className="space-y-2">
              {upcomingAppts.map((appt: any) => {
                const dt = new Date(appt.scheduled_at)
                const TZ = "America/Argentina/Buenos_Aires"
                const todayAR = new Date().toLocaleDateString("es-AR", { timeZone: TZ })
                const apptDateAR = dt.toLocaleDateString("es-AR", { timeZone: TZ })
                const isToday = todayAR === apptDateAR
                const patient = appt.patients as any
                return (
                  <Link
                    key={appt.id}
                    href={`/agenda/${appt.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <Clock size={14} className="text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {patient ? `${patient.first_name} ${patient.last_name}` : "Sin paciente"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {appt.type ?? "Consulta"} · {isToday ? "Hoy" : dt.toLocaleDateString("es-AR", { day: "2-digit", month: "short", timeZone: TZ })}{" "}
                        {dt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: TZ })}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      appt.status === "pendiente"   ? "bg-yellow-100 text-yellow-700" :
                      appt.status === "confirmado"  ? "bg-green-100 text-green-700"  :
                      appt.status === "completado"  ? "bg-gray-100 text-gray-500"    :
                                                      "bg-gray-100 text-gray-500"
                    }`}>
                      {appt.status}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Últimas ventas */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Últimas ventas de hoy</h2>
            <Link href="/sales" className="text-xs text-emerald-700 hover:underline">Ver ventas</Link>
          </div>

          {recentSales.length === 0 ? (
            <p className="text-sm text-gray-400">No hay ventas registradas hoy.</p>
          ) : (
            <div className="space-y-2">
              {recentSales.map((sale: any) => {
                const patient = sale.patients as any
                const hora = new Date(sale.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })
                return (
                  <Link
                    key={sale.id}
                    href={`/invoicing/${sale.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart size={14} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {patient ? `${patient.first_name} ${patient.last_name}` : "Sin paciente"}
                      </p>
                      <p className="text-xs text-gray-400">{hora} · {sale.payment_method ?? "—"}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700">
                      {formatCurrency(sale.total ?? 0)}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
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
      <div className={`${iconBg} p-2 rounded-lg flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-xl font-semibold mt-0.5 ${alert ? "text-amber-600" : "text-gray-900"}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
