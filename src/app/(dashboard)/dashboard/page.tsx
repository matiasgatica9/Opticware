import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/lib/get-tenant"
import { formatCurrency } from "@/lib/utils"
import { Users, Calendar, ShoppingCart, AlertTriangle, Clock, MessageCircle, Package, FlaskConical } from "lucide-react"
import Link from "next/link"

const TZ = "America/Argentina/Buenos_Aires"

export default async function DashboardPage() {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) return null

  const now = new Date()
  const todayStart = new Date(now.toLocaleDateString("en-CA", { timeZone: TZ }) + "T00:00:00-03:00")
  const in7Days = new Date(todayStart); in7Days.setDate(in7Days.getDate() + 7)
  const in24h   = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const tomorrowStr = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const todayStr    = todayStart.toISOString().slice(0, 10)

  const [
    patientsRes,
    appointmentsCountRes,
    salesRes,
    stockRes,
    upcomingRes,
    recentSalesRes,
    remindersRes,
    labAlertsRes,
    tenantRes,
  ] = await Promise.all([
    // Total pacientes activos
    supabase.from("patients").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).eq("active", true),

    // Turnos pendientes totales
    supabase.from("appointments").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).eq("status", "pendiente"),

    // Ventas de hoy
    supabase.from("sales").select("total")
      .eq("tenant_id", tenantId).gte("created_at", todayStart.toISOString()),

    // Stock (todos para filtrar en JS)
    supabase.from("products").select("id, name, stock, stock_min")
      .eq("tenant_id", tenantId).eq("active", true),

    // Próximos turnos (7 días)
    supabase.from("appointments")
      .select("id, scheduled_at, type, status, patients(first_name, last_name)")
      .eq("tenant_id", tenantId).neq("status", "cancelado")
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", in7Days.toISOString())
      .order("scheduled_at", { ascending: true }).limit(5),

    // Últimas ventas de hoy
    supabase.from("sales")
      .select("id, total, payment_method, created_at, patients(first_name, last_name)")
      .eq("tenant_id", tenantId).gte("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false }).limit(5),

    // Recordatorios: turnos en las próximas 24hs con teléfono del paciente
    supabase.from("appointments")
      .select("id, scheduled_at, type, patients(first_name, last_name, phone)")
      .eq("tenant_id", tenantId).eq("status", "pendiente")
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", in24h.toISOString())
      .order("scheduled_at", { ascending: true }),

    // Lab orders con estimated_return hoy o mañana y no entregados
    supabase.from("lab_orders")
      .select("id, estimated_return, status, patients(first_name, last_name), lab_name, work_type")
      .eq("tenant_id", tenantId)
      .not("status", "in", '("entregado","cancelado")')
      .lte("estimated_return", tomorrowStr)
      .gte("estimated_return", todayStr)
      .order("estimated_return", { ascending: true }),

    // Nombre del negocio para los mensajes de WhatsApp
    supabase.from("tenants").select("business_name").eq("id", tenantId).single(),
  ])

  const totalPatients       = patientsRes.count ?? 0
  const pendingAppointments = appointmentsCountRes.count ?? 0
  const todaySales          = salesRes.data?.reduce((sum, s) => sum + (s.total ?? 0), 0) ?? 0
  const allProducts         = stockRes.data ?? []
  const lowStockProducts    = allProducts.filter(p => p.stock <= p.stock_min)
  const upcomingAppts       = upcomingRes.data ?? []
  const recentSales         = recentSalesRes.data ?? []
  const reminders           = remindersRes.data ?? []
  const labAlerts           = labAlertsRes.data ?? []
  const businessName        = tenantRes.data?.business_name ?? "la óptica"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen del día</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={<Users size={18} className="text-blue-600" />}       iconBg="bg-blue-50"   label="Pacientes activos"  value={totalPatients.toLocaleString("es-AR")} />
        <StatCard icon={<Calendar size={18} className="text-violet-600" />}  iconBg="bg-violet-50" label="Turnos pendientes"  value={pendingAppointments.toString()} />
        <StatCard icon={<ShoppingCart size={18} className="text-emerald-600" />} iconBg="bg-emerald-50" label="Ventas hoy" value={formatCurrency(todaySales)} />
        <StatCard icon={<AlertTriangle size={18} className="text-amber-600" />}  iconBg="bg-amber-50"  label="Stock bajo"    value={lowStockProducts.length.toString()} alert={lowStockProducts.length > 0} />
      </div>

      {/* ── Automatizaciones ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Recordatorios de turno */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
              <MessageCircle size={14} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Recordatorios</h2>
              <p className="text-[11px] text-gray-400">Turnos en las próximas 24hs</p>
            </div>
          </div>
          {reminders.length === 0 ? (
            <p className="text-sm text-gray-400">No hay turnos en las próximas 24hs.</p>
          ) : (
            <div className="space-y-2">
              {reminders.map((appt: any) => {
                const dt      = new Date(appt.scheduled_at)
                const hora    = dt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
                const patient = appt.patients as any
                const phone   = patient?.phone?.replace(/\D/g, "")
                const nombre  = patient?.first_name ?? "paciente"
                const msg     = encodeURIComponent(
                  `Hola ${nombre}! Te recordamos que mañana tenés un turno en ${businessName} a las ${hora} hs. Cualquier consulta, escribinos. ¡Hasta mañana! 👋`
                )
                const waLink  = phone ? `https://wa.me/549${phone}?text=${msg}` : null
                return (
                  <div key={appt.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-gray-50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {patient ? `${patient.first_name} ${patient.last_name ?? ""}` : "Sin paciente"}
                      </p>
                      <p className="text-xs text-gray-400">{hora} hs · {appt.type ?? "Consulta"}</p>
                    </div>
                    {waLink ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors flex-shrink-0"
                      >
                        <MessageCircle size={11} />
                        Enviar
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 flex-shrink-0">Sin teléfono</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Stock bajo */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <Package size={14} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Stock bajo</h2>
                <p className="text-[11px] text-gray-400">Productos a reponer</p>
              </div>
            </div>
            <Link href="/stock" className="text-xs text-emerald-700 hover:underline">Ver stock</Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-400">Todo el stock está en orden. ✓</p>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((p: any) => (
                <Link
                  key={p.id}
                  href={`/stock/${p.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <p className="text-sm text-gray-800 truncate flex-1 mr-2">{p.name}</p>
                  <span className={`text-xs font-bold flex-shrink-0 ${p.stock === 0 ? "text-red-600" : "text-amber-600"}`}>
                    {p.stock === 0 ? "Sin stock" : `${p.stock} ud.`}
                  </span>
                </Link>
              ))}
              {lowStockProducts.length > 5 && (
                <p className="text-xs text-gray-400 text-center pt-1">
                  +{lowStockProducts.length - 5} productos más
                </p>
              )}
            </div>
          )}
        </div>

        {/* Lab orders por vencer */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <FlaskConical size={14} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Lab por entregar</h2>
                <p className="text-[11px] text-gray-400">Trabajos para hoy y mañana</p>
              </div>
            </div>
            <Link href="/lab-orders" className="text-xs text-emerald-700 hover:underline">Ver todos</Link>
          </div>
          {labAlerts.length === 0 ? (
            <p className="text-sm text-gray-400">No hay trabajos por entregar hoy ni mañana.</p>
          ) : (
            <div className="space-y-2">
              {labAlerts.map((order: any) => {
                const patient   = order.patients as any
                const isToday   = order.estimated_return === todayStr
                return (
                  <Link
                    key={order.id}
                    href={`/lab-orders/${order.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {patient ? `${patient.first_name} ${patient.last_name ?? ""}` : "Sin paciente"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{order.work_type ?? order.lab_name ?? "—"}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      isToday ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {isToday ? "Hoy" : "Mañana"}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

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
                const todayAR = new Date().toLocaleDateString("es-AR", { timeZone: TZ })
                const apptDateAR = dt.toLocaleDateString("es-AR", { timeZone: TZ })
                const isToday = todayAR === apptDateAR
                const patient = appt.patients as any
                return (
                  <Link key={appt.id} href={`/agenda/${appt.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
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
                      appt.status === "pendiente"  ? "bg-yellow-100 text-yellow-700" :
                      appt.status === "confirmado" ? "bg-green-100 text-green-700"  :
                                                      "bg-gray-100 text-gray-500"
                    }`}>{appt.status}</span>
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
                const hora = new Date(sale.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
                return (
                  <Link key={sale.id} href={`/sales/${sale.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
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

function StatCard({ icon, iconBg, label, value, alert }: {
  icon: React.ReactNode; iconBg: string; label: string; value: string; alert?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
      <div className={`${iconBg} p-2 rounded-lg flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-xl font-semibold mt-0.5 ${alert ? "text-amber-600" : "text-gray-900"}`}>{value}</p>
      </div>
    </div>
  )
}
