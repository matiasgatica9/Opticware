"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  ArrowLeft, Clock, Truck, FlaskConical, Package,
  CheckCircle2, XCircle, Calendar, Edit2, Check,
  DollarSign, AlertCircle,
} from "lucide-react"

const STEPS = [
  { key: "en_preparacion", label: "En preparación",  icon: Clock,         desc: "Trabajo registrado" },
  { key: "enviado",        label: "Enviado al lab",  icon: Truck,         desc: "Enviado al laboratorio" },
  { key: "en_laboratorio", label: "En laboratorio",  icon: FlaskConical,  desc: "Procesando en el lab" },
  { key: "recibido",       label: "Recibido",        icon: Package,       desc: "Llegó a la óptica" },
  { key: "listo",          label: "Listo p/ entrega",icon: CheckCircle2,  desc: "Listo para el paciente" },
  { key: "entregado",      label: "Entregado",       icon: CheckCircle2,  desc: "Entregado al paciente" },
]

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

const PAYMENT_METHODS = [
  { value: "efectivo",      label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "debito",        label: "Débito" },
  { value: "credito",       label: "Crédito" },
  { value: "mercadopago",   label: "MercadoPago" },
]

const METHOD_LABEL: Record<string, string> = {
  efectivo:      "Efectivo",
  transferencia: "Transferencia",
  debito:        "Débito",
  credito:       "Crédito",
  mercadopago:   "MercadoPago",
}

function formatDateAR(d: string | null) {
  if (!d) return "—"
  return new Date(d + "T12:00:00").toLocaleDateString("es-AR", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function formatMoney(n: number | null) {
  if (n == null) return "—"
  return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function getPaymentStatus(order: any) {
  const price   = order.price   ? parseFloat(order.price)   : null
  const deposit = order.deposit ? parseFloat(order.deposit) : 0

  if (!price || price === 0) return { type: "sin_precio",  label: "Sin precio",    color: "gray" }
  if (order.balance_paid_date || deposit >= price)
                               return { type: "pagado",     label: "Pagado",        color: "green" }
  if (deposit > 0)             return { type: "seña",       label: "Seña parcial",  color: "amber" }
  return                              { type: "sin_cobrar", label: "Sin cobrar",    color: "red" }
}

export default function LabOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [order, setOrder]       = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editDate, setEditDate] = useState<{ field: string; value: string } | null>(null)

  // Modal pago final
  const [showPayModal, setShowPayModal] = useState(false)
  const [payMethod, setPayMethod]       = useState("efectivo")
  const [payAmount, setPayAmount]       = useState("")
  const [savingPay, setSavingPay]       = useState(false)

  // Editar precio
  const [editPrice, setEditPrice] = useState(false)
  const [newPrice, setNewPrice]   = useState("")

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

    const today = new Date().toISOString().slice(0, 10)
    if (next === "enviado")   updates.sent_date      = today
    if (next === "recibido")  updates.received_date  = today
    if (next === "entregado") updates.delivered_date = today

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

  async function registerFinalPayment() {
    setSavingPay(true)
    const today   = new Date().toISOString().slice(0, 10)
    const price   = order.price   ? parseFloat(order.price)   : null
    const deposit = order.deposit ? parseFloat(order.deposit) : 0
    const amountPaid = payAmount ? parseFloat(payAmount) : (price ? price - deposit : 0)

    await supabase.from("lab_orders").update({
      balance_paid_date: today,
      balance_method:    payMethod,
      deposit:           deposit + amountPaid,
    }).eq("id", id)

    setSavingPay(false)
    setShowPayModal(false)
    await load()
  }

  async function savePrice() {
    const val = newPrice ? parseFloat(newPrice) : null
    await supabase.from("lab_orders").update({ price: val }).eq("id", id)
    setEditPrice(false)
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

  const currentIdx  = STEP_INDEX[order.status] ?? 0
  const isCancelled = order.status === "cancelado"
  const isFinished  = order.status === "entregado"
  const canAdvance  = !isCancelled && !isFinished
  const patient     = order.patients as any
  const today       = new Date().toISOString().slice(0, 10)
  const isOverdue   = order.estimated_return && order.estimated_return < today &&
    !["recibido","listo","entregado","cancelado"].includes(order.status)

  const payStatus  = getPaymentStatus(order)
  const price      = order.price   ? parseFloat(order.price)   : null
  const deposit    = order.deposit ? parseFloat(order.deposit) : 0
  const balance    = price != null ? price - deposit : null
  const hasPending = payStatus.type === "seña" || payStatus.type === "sin_cobrar"

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

      {/* CARD PAGO */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Cuenta del trabajo</h2>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            payStatus.color === "green" ? "bg-emerald-100 text-emerald-700" :
            payStatus.color === "amber" ? "bg-amber-100 text-amber-700" :
            payStatus.color === "red"   ? "bg-red-100 text-red-600" :
                                          "bg-gray-100 text-gray-500"
          }`}>
            {payStatus.label}
          </span>
        </div>

        {/* Precio total */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Precio total</span>
          <div className="flex items-center gap-2">
            {editPrice ? (
              <>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    className="w-28 pl-5 pr-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    autoFocus
                  />
                </div>
                <button onClick={savePrice} className="text-xs text-emerald-700 font-medium hover:underline">Guardar</button>
                <button onClick={() => setEditPrice(false)} className="text-xs text-gray-400 hover:underline">Cancelar</button>
              </>
            ) : (
              <>
                <span className="font-semibold text-gray-800">{formatMoney(price)}</span>
                <button
                  onClick={() => { setEditPrice(true); setNewPrice(price?.toString() ?? "") }}
                  className="text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <Edit2 size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Seña */}
        {deposit > 0 && !order.balance_paid_date && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Seña recibida
              {order.deposit_date && (
                <span className="text-xs text-gray-400 ml-1">({formatDateAR(order.deposit_date)})</span>
              )}
              {order.deposit_method && (
                <span className="text-xs text-gray-400 ml-1">· {METHOD_LABEL[order.deposit_method] ?? order.deposit_method}</span>
              )}
            </span>
            <span className="font-medium text-gray-700">{formatMoney(deposit)}</span>
          </div>
        )}

        {/* Saldo pendiente */}
        {balance != null && balance > 0 && !order.balance_paid_date && (
          <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={13} className="text-amber-500" />
              <span className="font-medium text-amber-700">Saldo al retirar</span>
            </div>
            <span className="font-bold text-amber-700">{formatMoney(balance)}</span>
          </div>
        )}

        {/* Pago total registrado */}
        {order.balance_paid_date && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-emerald-700">✓ Trabajo completamente abonado</span>
              <span className="font-bold text-emerald-700">{formatMoney(price)}</span>
            </div>
            {deposit > 0 && order.deposit_date && (
              <p className="text-xs text-emerald-600">
                Seña {formatMoney(deposit)} ({formatDateAR(order.deposit_date)}
                {order.deposit_method ? ` · ${METHOD_LABEL[order.deposit_method] ?? order.deposit_method}` : ""})
              </p>
            )}
            <p className="text-xs text-emerald-600">
              Saldo cobrado: {formatDateAR(order.balance_paid_date)}
              {order.balance_method ? ` · ${METHOD_LABEL[order.balance_method] ?? order.balance_method}` : ""}
            </p>
          </div>
        )}

        {/* Botón registrar pago */}
        {hasPending && !isCancelled && (
          <button
            onClick={() => {
              setPayAmount(balance != null && balance > 0 ? balance.toString() : "")
              setShowPayModal(true)
            }}
            className="w-full py-2 border border-emerald-600 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-50 transition-colors"
          >
            {payStatus.type === "seña"
              ? `Registrar cobro del saldo (${formatMoney(balance)})`
              : "Registrar pago"}
          </button>
        )}
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
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />

            <div className="space-y-1">
              {STEPS.map((step, idx) => {
                const Icon    = step.icon
                const done    = idx < currentIdx
                const active  = idx === currentIdx

                return (
                  <div key={step.key} className="flex items-start gap-4 py-2 relative">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      done    ? "bg-emerald-700 text-white" :
                      active  ? "bg-white border-2 border-emerald-700 text-emerald-700" :
                               "bg-white border-2 border-gray-200 text-gray-300"
                    }`}>
                      {done ? <Check size={14} /> : <Icon size={14} />}
                    </div>

                    <div className="flex-1 pt-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        done ? "text-gray-500" : active ? "text-gray-900" : "text-gray-300"
                      }`}>
                        {step.label}
                      </p>

                      {active && (
                        <p className="text-xs text-emerald-700 font-medium">← Estado actual</p>
                      )}

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

      {/* MODAL PAGO FINAL */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Registrar cobro</h3>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Monto cobrado</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  autoFocus
                />
              </div>
              {balance != null && balance > 0 && (
                <p className="text-xs text-gray-400 mt-1">Saldo pendiente: {formatMoney(balance)}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2">Forma de pago</label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setPayMethod(m.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      payMethod === m.value
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={registerFinalPayment}
                disabled={savingPay}
                className="flex-1 py-2.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors"
              >
                {savingPay ? "Guardando..." : "Confirmar cobro"}
              </button>
            </div>
          </div>
        </div>
      )}
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
