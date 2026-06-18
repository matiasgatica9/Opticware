"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  ArrowLeft, Clock, Truck, FlaskConical, Package,
  CheckCircle2, XCircle, Calendar, Edit2, Check,
} from "lucide-react"

const STEPS = [
  { key: "en_preparacion", label: "En preparación",  icon: Clock,         desc: "Trabajo registrado" },
  { key: "enviado",        label: "Enviado al lab",  icon: Truck,         desc: "Enviado al laboratorio" },
  { key: "en_laboratorio", label: "En laboratorio",  icon: FlaskConical,  desc: "Procesando en el lab" },
  { key: "recibido",       label: "Recibido",        icon: Package,       desc: "Llegó a la óptica" },
  { key: "listo",          label: "Listo p/ entrega",icon: CheckCircle2,  desc: "Listo para el paciente" },
  { key: "entregado",      label: "Entregado",       icon: CheckCircle2,  desc: "Entregado al paciente" },
]

// Indice de cada estado en el flujo
const STEP_INDEX: Record<string, number> = Object.fromEntries(
  STEPS.map((s, i) => [s.key, i])
)

const WORK_TYPE_LABELS: Record<string, string> = {
  lentes:     "Lentes oftálmicos",
  montaje:    "Montaje",
  tratamiento:"Tratamiento / Antirreflejo",
  reparacion: "Reparación de armazón",
  contacto:   "Lentes de contacto",
  otro:       "Otro",
}

function formatDateAR(d: string | null) {
  if (!d) return "—"
  return new Date(d + "T12:00:00").toLocaleDateString("es-AR", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

export default function LabOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [order, setOrder]       = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editDate, setEditDate] = useState<{ field: string; value: string } | null>(null)

  async function load() {
    const { data } = await supabase
      .from("lab_orders")
      .select("*, patients(first_name, last_name, phone)")
      .eq("id", id)
      .single()
    setOrder(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function advanceStatus() {
    if (!order) return
    const idx = STEP_INDEX[order.status] ?? 0
    if (idx >= STEPS.length - 1) return
    const next = STEPS[idx + 1].key

    setUpdating(true)
    const updates: any = { status: next }

    // Actualizar fechas automáticamente al avanzar
    const today = new Date().toISOString().slice(0, 10)
    if (next === "enviado")        updates.sent_date     = today
    if (next === "recibido")       updates.received_date = today
    if (next === "entregado")      updates.delivered_date = today

    await supabase.from("lab_orders").update(updates).eq("id", id)
    await load()
    setUpdating(false)
  }

  async function cancelOrder() {
    if (!confirm("¿Cancelar este trabajo?")) return
    await supabase.from("lab_orders").update({ status: "cancelado" }).eq("id", id)
    await load()
  }

  async function saveDate(field: string, value: string) {
    await supabase.from("lab_orders").update({ [field]: value || null }).eq("id", id)
    setEditDate(null)
    await load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Cargando...
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Trabajo no encontrado</p>
        <Link href="/lab-orders" className="text-emerald-700 text-sm mt-2 inline-block hover:underline">
          Volver a la lista
        </Link>
      </div>
    )
  }

  const currentIdx = STEP_INDEX[order.status] ?? 0
  const isCancelled = order.status === "cancelado"
  const isFinished = order.status === "entregado"
  const canAdvance = !isCancelled && !isFinished
  const patient = order.patients as any
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = order.estimated_return && order.estimated_return < today &&
    !["recibido","listo","entregado","cancelado"].includes(order.status)

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/lab-orders"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-gray-900">
              {patient ? `${patient.first_name} ${patient.last_name}` : "Trabajo de laboratorio"}
            </h1>
            {order.priority === "urgente" && (
              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                Urgente
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {WORK_TYPE_LABELS[order.work_type] ?? order.work_type}
            {order.lab_name && ` · ${order.lab_name}`}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-5">Seguimiento del trabajo</h2>

        {isCancelled ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <XCircle size={20} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Trabajo cancelado</p>
              <p className="text-xs text-red-500 mt-0.5">Este trabajo fue cancelado</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Línea vertical */}
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />

            <div className="space-y-1">
              {STEPS.map((step, idx) => {
                const Icon = step.icon
                const done = idx < currentIdx
                const active = idx === currentIdx
                const pending = idx > currentIdx

                return (
                  <div key={step.key} className="flex items-start gap-4 py-2 relative">
                    {/* Ícono */}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      done    ? "bg-emerald-700 text-white" :
                      active  ? "bg-white border-2 border-emerald-700 text-emerald-700" :
                               "bg-white border-2 border-gray-200 text-gray-300"
                    }`}>
                      {done ? <Check size={14} /> : <Icon size={14} />}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 pt-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        done ? "text-gray-500" : active ? "text-gray-900" : "text-gray-300"
                      }`}>
                        {step.label}
                      </p>

                      {/* Fecha asociada */}
                      {active && (
                        <p className="text-xs text-emerald-700 font-medium">
                          ← Estado actual
                        </p>
                      )}

                      {/* Mostrar fechas reales */}
                      {step.key === "en_preparacion" && order.order_date && (
                        <DateRow label="Pedido" value={order.order_date} field="order_date" done={done || active} onEdit={setEditDate} editDate={editDate} onSave={saveDate} />
                      )}
                      {step.key === "enviado" && (
                        <DateRow label="Enviado" value={order.sent_date} field="sent_date" done={done || active} onEdit={setEditDate} editDate={editDate} onSave={saveDate} />
                      )}
                      {step.key === "en_laboratorio" && order.estimated_return && (
                        <p className={`text-xs mt-0.5 ${isOverdue && !done ? "text-amber-600 font-medium" : "text-gray-400"}`}>
                          Retorno estimado: {formatDateAR(order.estimated_return)}
                          {isOverdue && !done && " ⚠ Vencido"}
                        </p>
                      )}
                      {step.key === "recibido" && (
                        <DateRow label="Recibido" value={order.received_date} field="received_date" done={done || active} onEdit={setEditDate} editDate={editDate} onSave={saveDate} />
                      )}
                      {step.key === "entregado" && (
                        <DateRow label="Entregado" value={order.delivered_date} field="delivered_date" done={done || active} onEdit={setEditDate} editDate={editDate} onSave={saveDate} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Botón avanzar */}
        {canAdvance && (
          <div className="mt-5 flex gap-2">
            <button
              onClick={advanceStatus}
              disabled={updating}
              className="flex-1 bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors"
            >
              {updating ? "Actualizando..." : `Marcar como: ${STEPS[currentIdx + 1]?.label ?? ""}`}
            </button>
            <button
              onClick={cancelOrder}
              className="px-4 py-2.5 border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {isFinished && (
          <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <CheckCircle2 size={16} className="text-green-600" />
            <p className="text-sm text-green-700 font-medium">Trabajo completado y entregado al paciente</p>
          </div>
        )}
      </div>

      {/* Detalle */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <div className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Detalle del trabajo</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{order.work_description}</p>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Tipo</span>
            <span className="text-gray-800 font-medium">{WORK_TYPE_LABELS[order.work_type] ?? order.work_type}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Laboratorio</span>
            <span className="text-gray-800 font-medium">{order.lab_name || "—"}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Días estimados en lab</span>
            <span className="text-gray-800 font-medium">
              {order.estimated_days ? `${order.estimated_days} días` : "—"}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Retorno estimado</span>
            <span className={`font-medium ${isOverdue ? "text-amber-600" : "text-gray-800"}`}>
              {formatDateAR(order.estimated_return)}
            </span>
          </div>
          {patient?.phone && (
            <div className="col-span-2">
              <span className="text-xs text-gray-400 block mb-0.5">Teléfono del paciente</span>
              <a
                href={`https://wa.me/549${patient.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-medium text-sm hover:underline"
              >
                📱 {patient.phone}
              </a>
            </div>
          )}
        </div>

        {order.notes && (
          <div className="p-5">
            <span className="text-xs text-gray-400 block mb-1">Observaciones</span>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function DateRow({
  label, value, field, done, onEdit, editDate, onSave,
}: {
  label: string
  value: string | null
  field: string
  done: boolean
  onEdit: (v: { field: string; value: string } | null) => void
  editDate: { field: string; value: string } | null
  onSave: (field: string, value: string) => void
}) {
  const isEditing = editDate?.field === field

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <input
          type="date"
          value={editDate?.value ?? ""}
          onChange={e => onEdit({ field, value: e.target.value })}
          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-600"
        />
        <button
          onClick={() => onSave(field, editDate?.value ?? "")}
          className="text-xs text-emerald-700 font-medium hover:underline"
        >
          Guardar
        </button>
        <button onClick={() => onEdit(null)} className="text-xs text-gray-400 hover:underline">
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 mt-0.5">
      <Calendar size={11} className="text-gray-400" />
      <span className="text-xs text-gray-500">
        {label}: {value
          ? new Date(value + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
          : "—"}
      </span>
      {done && (
        <button
          onClick={() => onEdit({ field, value: value ?? "" })}
          className="text-gray-300 hover:text-gray-500 transition-colors"
        >
          <Edit2 size={11} />
        </button>
      )}
    </div>
  )
}
