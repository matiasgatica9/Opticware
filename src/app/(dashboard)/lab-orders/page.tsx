import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/lib/get-tenant"
import Link from "next/link"
import { Plus, FlaskConical, Clock, CheckCircle2, Truck, Package, XCircle, AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  en_preparacion: { label: "En preparación", color: "text-gray-600",   bg: "bg-gray-100",    icon: Clock        },
  enviado:        { label: "Enviado al lab",  color: "text-blue-700",  bg: "bg-blue-100",   icon: Truck        },
  en_laboratorio: { label: "En laboratorio",  color: "text-violet-700",bg: "bg-violet-100", icon: FlaskConical },
  recibido:       { label: "Recibido",        color: "text-amber-700", bg: "bg-amber-100",  icon: Package      },
  listo:          { label: "Listo p/ entrega",color: "text-emerald-700",bg: "bg-emerald-100",icon: CheckCircle2 },
  entregado:      { label: "Entregado",       color: "text-green-700", bg: "bg-green-100",  icon: CheckCircle2 },
  cancelado:      { label: "Cancelado",       color: "text-red-700",   bg: "bg-red-100",    icon: XCircle      },
}

const WORK_TYPE_LABELS: Record<string, string> = {
  lentes:     "Lentes oftálmicos",
  montaje:    "Montaje",
  tratamiento:"Tratamiento / AR",
  reparacion: "Reparación",
  contacto:   "Lentes de contacto",
  otro:       "Otro",
}

export default async function LabOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) redirect("/login")

  let query = supabase
    .from("lab_orders")
    .select("*, patients(first_name, last_name)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  if (status) query = query.eq("status", status)

  const { data: orders } = await query
  const list = orders ?? []

  // Conteos por estado
  const { data: all } = await supabase
    .from("lab_orders")
    .select("status")
    .eq("tenant_id", tenantId)
  const counts = (all ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})
  const total = (all ?? []).length

  // Trabajos urgentes o próximos a vencer
  const today = new Date().toISOString().slice(0, 10)
  const urgent = list.filter(o =>
    o.priority === "urgente" && !["entregado","cancelado"].includes(o.status)
  )
  const overdue = list.filter(o =>
    o.estimated_return && o.estimated_return < today &&
    !["recibido","listo","entregado","cancelado"].includes(o.status)
  )

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Trabajos de laboratorio</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} trabajo{total !== 1 ? "s" : ""} en total</p>
        </div>
        <Link
          href="/lab-orders/new"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          <Plus size={16} />
          Nuevo trabajo
        </Link>
      </div>

      {/* Alertas */}
      {(urgent.length > 0 || overdue.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {urgent.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700 flex-1">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span><strong>{urgent.length}</strong> trabajo{urgent.length > 1 ? "s" : ""} urgente{urgent.length > 1 ? "s" : ""}</span>
            </div>
          )}
          {overdue.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-700 flex-1">
              <Clock size={15} className="flex-shrink-0" />
              <span><strong>{overdue.length}</strong> vencido{overdue.length > 1 ? "s" : ""} sin recibir</span>
            </div>
          )}
        </div>
      )}

      {/* Filtros por estado */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/lab-orders"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            !status ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          Todos ({total})
        </Link>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = counts[key] ?? 0
          if (count === 0) return null
          return (
            <Link
              key={key}
              href={`/lab-orders?status=${key}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                status === key
                  ? `${cfg.bg} ${cfg.color} border-current`
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cfg.label} ({count})
            </Link>
          )
        })}
      </div>

      {/* Lista */}
      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FlaskConical size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay trabajos {status ? "con ese estado" : "registrados"}</p>
          <Link href="/lab-orders/new" className="mt-3 inline-block text-sm text-emerald-700 font-medium hover:underline">
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.en_preparacion
            const Icon = cfg.icon
            const patient = (order.patients as any)
            const isUrgent = order.priority === "urgente"
            const isOverdue = order.estimated_return && order.estimated_return < today &&
              !["recibido","listo","entregado","cancelado"].includes(order.status)

            return (
              <Link
                key={order.id}
                href={`/lab-orders/${order.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {patient ? `${patient.first_name} ${patient.last_name}` : "Sin paciente"}
                      </span>
                      {isUrgent && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          Urgente
                        </span>
                      )}
                      {isOverdue && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          Vencido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {WORK_TYPE_LABELS[order.work_type] ?? order.work_type}
                      {order.lab_name && <span className="text-gray-400"> · {order.lab_name}</span>}
                    </p>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-1">{order.work_description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>Pedido: {formatDate(order.order_date)}</span>
                      {order.estimated_return && (
                        <span className={isOverdue ? "text-amber-600 font-medium" : ""}>
                          Retorno est.: {formatDate(order.estimated_return)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg flex-shrink-0 ${cfg.bg}`}>
                    <Icon size={13} className={cfg.color} />
                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
