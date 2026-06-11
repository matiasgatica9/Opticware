"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  TrendingUp, Users, ShoppingCart, CreditCard,
  Package, Calendar,
} from "lucide-react"

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface SaleRow {
  id: string
  total: number
  payment_method: string
  status: string
  created_at: string
}
interface SaleItemRow {
  quantity: number
  subtotal: number
  products: { name: string } | null
}
interface PatientRow { created_at: string }

// ─── Constantes ──────────────────────────────────────────────────────────────
const PERIODS = [
  { label: "7 días",   days: 7   },
  { label: "30 días",  days: 30  },
  { label: "90 días",  days: 90  },
  { label: "Este año", days: 365 },
]

const METHOD_LABELS: Record<string, string> = {
  efectivo:      "Efectivo",
  transferencia: "Transferencia",
  mercadopago:   "MercadoPago",
  obra_social:   "Obra social",
  credito:       "Tarjeta crédito",
  debito:        "Tarjeta débito",
}

const METHOD_COLORS: Record<string, string> = {
  efectivo:      "bg-emerald-500",
  transferencia: "bg-blue-500",
  mercadopago:   "bg-cyan-500",
  obra_social:   "bg-purple-500",
  credito:       "bg-amber-500",
  debito:        "bg-orange-500",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toDateKey(d: Date) {
  return d.toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" })
}

function dayLabel(key: string, days: number) {
  const d = new Date(key + "T12:00:00")
  if (days <= 30) return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
  if (days <= 90) return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
  return d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" })
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", color)}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
    </div>
  )
}

function BarChart({
  data, maxValue, formatValue, labelKey, valueKey, days,
}: {
  data: any[]
  maxValue: number
  formatValue: (v: number) => string
  labelKey: string
  valueKey: string
  days: number
}) {
  if (data.length === 0) return (
    <p className="text-sm text-gray-400 text-center py-8">Sin datos para el período</p>
  )

  // Para períodos grandes, agrupar por semana o mes
  const displayed = days <= 30 ? data : days <= 90
    ? groupByWeek(data, labelKey, valueKey)
    : groupByMonth(data, labelKey, valueKey)

  const max = Math.max(...displayed.map(d => d[valueKey]), 1)

  return (
    <div className="flex items-end gap-1 h-36 w-full">
      {displayed.map((item, idx) => {
        const pct = (item[valueKey] / max) * 100
        return (
          <div key={idx} className="flex flex-col items-center flex-1 gap-1 group relative">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
              {formatValue(item[valueKey])}
            </div>
            <div className="w-full flex items-end h-28">
              <div
                className="w-full bg-emerald-500 rounded-t transition-all hover:bg-emerald-600"
                style={{ height: `${Math.max(2, pct)}%` }}
              />
            </div>
            <span className="text-[9px] text-gray-400 truncate w-full text-center">
              {item[labelKey]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function groupByWeek(data: any[], labelKey: string, valueKey: string) {
  const map: Record<string, number> = {}
  data.forEach(d => {
    const date = new Date(d[labelKey] + "T12:00:00")
    const monday = new Date(date)
    monday.setDate(date.getDate() - date.getDay() + 1)
    const key = monday.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    map[key] = (map[key] ?? 0) + d[valueKey]
  })
  return Object.entries(map).map(([k, v]) => ({ [labelKey]: k, [valueKey]: v }))
}

function groupByMonth(data: any[], labelKey: string, valueKey: string) {
  const map: Record<string, number> = {}
  data.forEach(d => {
    const date = new Date(d[labelKey] + "T12:00:00")
    const key = date.toLocaleDateString("es-AR", { month: "short", year: "2-digit" })
    map[key] = (map[key] ?? 0) + d[valueKey]
  })
  return Object.entries(map).map(([k, v]) => ({ [labelKey]: k, [valueKey]: v }))
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [period, setPeriod]     = useState(30)
  const [sales, setSales]       = useState<SaleRow[]>([])
  const [saleItems, setSaleItems] = useState<SaleItemRow[]>([])
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [tenantId, setTenantId] = useState<string | null>(null)

  // Cargar todo al cambiar período
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: ud } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
      if (!ud) return
      setTenantId(ud.tenant_id)

      const from = new Date()
      from.setDate(from.getDate() - period)
      const fromIso = from.toISOString()

      const [salesRes, itemsRes, patientsRes] = await Promise.all([
        supabase.from("sales")
          .select("id, total, payment_method, status, created_at")
          .eq("tenant_id", ud.tenant_id)
          .neq("status", "cancelado")
          .gte("created_at", fromIso)
          .order("created_at"),
        supabase.from("sale_items")
          .select("quantity, subtotal, products(name)")
          .eq("tenant_id", ud.tenant_id)
          .gte("created_at", fromIso),
        supabase.from("patients")
          .select("created_at")
          .eq("tenant_id", ud.tenant_id)
          .gte("created_at", fromIso),
      ])

      setSales(salesRes.data ?? [])
      setSaleItems(itemsRes.data as SaleItemRow[] ?? [])
      setPatients(patientsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [period])

  // ── Cálculos ──
  const entregadas   = sales.filter(s => s.status === "entregado")
  const totalRevenue = entregadas.reduce((s, v) => s + Number(v.total), 0)
  const ticketProm   = entregadas.length > 0 ? totalRevenue / entregadas.length : 0
  const totalSales   = sales.length
  const newPatients  = patients.length

  // Ventas por día
  const salesByDay: Record<string, number> = {}
  const from = new Date(); from.setDate(from.getDate() - period)
  for (let d = new Date(from); d <= new Date(); d.setDate(d.getDate() + 1)) {
    salesByDay[toDateKey(new Date(d))] = 0
  }
  sales.forEach(s => {
    const key = toDateKey(new Date(s.created_at))
    if (key in salesByDay) salesByDay[key] = (salesByDay[key] ?? 0) + Number(s.total)
  })
  const salesDayData = Object.entries(salesByDay).map(([date, total]) => ({
    date: dayLabel(date, period),
    total,
  }))

  // Por forma de pago
  const byMethod: Record<string, number> = {}
  sales.forEach(s => {
    byMethod[s.payment_method] = (byMethod[s.payment_method] ?? 0) + Number(s.total)
  })
  const methodData = Object.entries(byMethod)
    .sort((a, b) => b[1] - a[1])
    .map(([method, total]) => ({ method, total }))
  const methodMax = methodData[0]?.total ?? 1

  // Top productos
  const byProduct: Record<string, { name: string; qty: number; revenue: number }> = {}
  saleItems.forEach(item => {
    const name = item.products?.name ?? "Desconocido"
    if (!byProduct[name]) byProduct[name] = { name, qty: 0, revenue: 0 }
    byProduct[name].qty     += item.quantity
    byProduct[name].revenue += Number(item.subtotal)
  })
  const topProducts = Object.values(byProduct)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
  const productMax = topProducts[0]?.revenue ?? 1

  // Estado del pipeline
  const pipelineData = [
    { label: "En proceso",    key: "en_proceso",    count: sales.filter(s => s.status === "en_proceso").length,    color: "bg-yellow-400" },
    { label: "En producción", key: "en_produccion", count: sales.filter(s => s.status === "en_produccion").length, color: "bg-blue-400"   },
    { label: "Listo",         key: "listo",         count: sales.filter(s => s.status === "listo").length,         color: "bg-emerald-400"},
    { label: "Entregado",     key: "entregado",     count: sales.filter(s => s.status === "entregado").length,     color: "bg-gray-300"   },
  ]

  return (
    <div className="space-y-6">
      {/* Header + período */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Resumen de actividad</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {PERIODS.map(p => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                period === p.days
                  ? "bg-emerald-700 text-white"
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center text-sm text-gray-400">
          Cargando datos...
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-3">
            <KpiCard
              icon={TrendingUp}
              label="Ingresos (entregadas)"
              value={formatCurrency(totalRevenue)}
              sub={`${entregadas.length} venta${entregadas.length !== 1 ? "s" : ""} entregada${entregadas.length !== 1 ? "s" : ""}`}
              color="bg-emerald-600"
            />
            <KpiCard
              icon={ShoppingCart}
              label="Ventas registradas"
              value={String(totalSales)}
              sub={`Ticket prom. ${formatCurrency(ticketProm)}`}
              color="bg-blue-500"
            />
            <KpiCard
              icon={Users}
              label="Pacientes nuevos"
              value={String(newPatients)}
              color="bg-purple-500"
            />
            <KpiCard
              icon={Calendar}
              label="Período"
              value={`${period} días`}
              sub={`Desde ${new Date(Date.now() - period * 86400000).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`}
              color="bg-amber-500"
            />
          </div>

          {/* Gráfico ventas por día */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Ventas por {period <= 30 ? "día" : period <= 90 ? "semana" : "mes"}
            </h2>
            <BarChart
              data={salesDayData}
              maxValue={Math.max(...salesDayData.map(d => d.total), 1)}
              formatValue={formatCurrency}
              labelKey="date"
              valueKey="total"
              days={period}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Top productos */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package size={14} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-700">Productos más vendidos</h2>
              </div>
              {topProducts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin ventas en el período</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, idx) => (
                    <div key={p.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-gray-700 font-medium truncate max-w-[140px]">{p.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-gray-900 font-semibold">{formatCurrency(p.revenue)}</span>
                          <span className="text-gray-400 ml-1">({p.qty}u.)</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${(p.revenue / productMax) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formas de pago */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={14} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-700">Formas de pago</h2>
              </div>
              {methodData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin ventas en el período</p>
              ) : (
                <div className="space-y-3">
                  {methodData.map(({ method, total }) => (
                    <div key={method}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium">{METHOD_LABELS[method] ?? method}</span>
                        <span className="text-gray-900 font-semibold">{formatCurrency(total)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", METHOD_COLORS[method] ?? "bg-gray-400")}
                          style={{ width: `${(total / methodMax) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pipeline de ventas */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Pipeline de ventas activo</h2>
            <div className="grid grid-cols-4 gap-3">
              {pipelineData.map(({ label, count, color }) => (
                <div key={label} className="text-center">
                  <div className={cn("h-2 rounded-full mb-3", color)} />
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            {/* Barra proporcional */}
            {totalSales > 0 && (
              <div className="flex h-2 rounded-full overflow-hidden mt-4 gap-0.5">
                {pipelineData.map(({ key, count, color }) =>
                  count > 0 ? (
                    <div
                      key={key}
                      className={cn("h-full transition-all", color)}
                      style={{ width: `${(count / totalSales) * 100}%` }}
                    />
                  ) : null
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
