"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, User, Package, CreditCard, FileText, Receipt } from "lucide-react"
import WhatsAppButton from "@/components/whatsapp/WhatsAppButton"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  en_proceso:    "bg-yellow-50 text-yellow-700 border-yellow-200",
  en_produccion: "bg-blue-50 text-blue-700 border-blue-200",
  listo:         "bg-emerald-50 text-emerald-700 border-emerald-200",
  entregado:     "bg-gray-100 text-gray-500 border-gray-200",
  cancelado:     "bg-red-50 text-red-400 border-red-200",
}

const STATUS_LABELS: Record<string, string> = {
  en_proceso:    "En proceso",
  en_produccion: "En producción",
  listo:         "Listo para entregar",
  entregado:     "Entregado",
  cancelado:     "Cancelado",
}

const METHOD_LABELS: Record<string, string> = {
  efectivo:      "Efectivo",
  transferencia: "Transferencia",
  mercadopago:   "MercadoPago",
  obra_social:   "Obra social",
  credito:       "Tarjeta crédito",
  debito:        "Tarjeta débito",
}

// Pipeline: qué acciones tiene cada estado
const NEXT_STATUS: Record<string, { label: string; value: string; color: string }[]> = {
  en_proceso:    [
    { label: "Pasar a producción",   value: "en_produccion", color: "bg-blue-600 text-white hover:bg-blue-700" },
    { label: "Cancelar venta",       value: "cancelado",     color: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" },
  ],
  en_produccion: [
    { label: "Marcar como listo",    value: "listo",         color: "bg-emerald-700 text-white hover:bg-emerald-800" },
    { label: "Cancelar venta",       value: "cancelado",     color: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" },
  ],
  listo:         [
    { label: "Confirmar entrega",    value: "entregado",     color: "bg-emerald-700 text-white hover:bg-emerald-800" },
  ],
  entregado:     [],
  cancelado:     [
    { label: "Reabrir venta",        value: "en_proceso",    color: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
  ],
}

// Progreso visual del pipeline
const PIPELINE = ["en_proceso", "en_produccion", "listo", "entregado"]

export default function SaleDetailPage() {
  const { id } = useParams() as { id: string }
  const [sale, setSale] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [invoice, setInvoice] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: ud } = await supabase.from("users").select("tenant_id, tenants(business_name)").eq("id", user.id).single()
        if (ud) setBusinessName((ud.tenants as any)?.business_name ?? "")
      }
      const [saleRes, itemsRes] = await Promise.all([
        supabase.from("sales").select("*, patients(id, first_name, last_name, phone, dni)").eq("id", id).single(),
        supabase.from("sale_items").select("*, products(name, category, sku)").eq("sale_id", id).order("created_at"),
      ])
      setSale(saleRes.data)
      setItems(itemsRes.data ?? [])
      // Cargar factura si existe
      if (saleRes.data?.invoice_id) {
        const { data: inv } = await supabase
          .from("invoices")
          .select("id, invoice_number, total, invoice_type")
          .eq("id", saleRes.data.invoice_id)
          .single()
        setInvoice(inv)
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function updateStatus(status: string) {
    setUpdating(true)
    const supabase = createClient()
    await supabase.from("sales").update({ status }).eq("id", id)
    setSale((prev: any) => ({ ...prev, status }))
    setUpdating(false)
  }

  if (loading) return <div className="h-40 flex items-center justify-center text-sm text-gray-400">Cargando...</div>
  if (!sale) return <div className="text-sm text-gray-500">Venta no encontrada.</div>

  const actions = NEXT_STATUS[sale.status] ?? []
  const pipelineIdx = PIPELINE.indexOf(sale.status)

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/sales" className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={15} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">Venta</h1>
            <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", STATUS_STYLES[sale.status])}>
              {STATUS_LABELS[sale.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500">{formatDate(sale.created_at)}</p>
        </div>
        {/* Botón factura */}
        {!sale.invoice_id ? (
          <Link
            href={`/invoicing/new?sale_id=${sale.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            <Receipt size={13} />
            Emitir factura
          </Link>
        ) : (
          <Link
            href={`/invoicing/${sale.invoice_id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
          >
            <Receipt size={13} />
            Ver factura
          </Link>
        )}
      </div>

      {/* Pipeline tracker */}
      {sale.status !== "cancelado" && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center">
            {PIPELINE.map((step, idx) => (
              <div key={step} className="flex items-center flex-1">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0",
                  idx < pipelineIdx
                    ? "bg-emerald-700 border-emerald-700 text-white"
                    : idx === pipelineIdx
                    ? "bg-emerald-50 border-emerald-700 text-emerald-700"
                    : "bg-gray-50 border-gray-200 text-gray-300"
                )}>
                  {idx < pipelineIdx ? "✓" : idx + 1}
                </div>
                <div className="flex-1 px-2">
                  <p className={cn("text-xs font-medium", idx <= pipelineIdx ? "text-gray-700" : "text-gray-300")}>
                    {STATUS_LABELS[step]}
                  </p>
                </div>
                {idx < PIPELINE.length - 1 && (
                  <div className={cn("w-6 h-0.5 shrink-0", idx < pipelineIdx ? "bg-emerald-700" : "bg-gray-200")} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Left — details */}
        <div className="col-span-2 space-y-4">
          {/* Patient */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Paciente</h2>
            {sale.patients ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-semibold">
                  {sale.patients.first_name[0]}{sale.patients.last_name[0]}
                </div>
                <div>
                  <Link href={`/patients/${sale.patients.id}`} className="text-sm font-medium text-gray-900 hover:text-emerald-700 transition-colors">
                    {sale.patients.last_name}, {sale.patients.first_name}
                  </Link>
                  <div className="flex gap-3 mt-0.5">
                    {sale.patients.dni && <p className="text-xs text-gray-400">DNI {sale.patients.dni}</p>}
                    {sale.patients.phone && <p className="text-xs text-gray-400">{sale.patients.phone}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 flex items-center gap-2"><User size={13} /> Sin paciente vinculado</p>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <Package size={13} className="text-gray-400" />
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Productos</h2>
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">Sin ítems</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 text-xs text-gray-400">
                    <th className="text-left px-4 py-2">Producto</th>
                    <th className="text-center px-4 py-2 w-16">Cant.</th>
                    <th className="text-right px-4 py-2 w-24">P. unit.</th>
                    <th className="text-right px-4 py-2 w-24">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-900">{item.products?.name}</p>
                        {item.products?.sku && <p className="text-xs text-gray-400">{item.products.sku}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-center text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Notes */}
          {sale.notes && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={13} className="text-gray-400" />
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notas</h2>
              </div>
              <p className="text-sm text-gray-600">{sale.notes}</p>
            </div>
          )}
        </div>

        {/* Right — summary + actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={13} className="text-gray-400" />
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pago</h2>
            </div>
            <p className="text-sm text-gray-700 font-medium">{METHOD_LABELS[sale.payment_method] ?? sale.payment_method}</p>

            <div className="border-t border-gray-100 pt-3 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-xs text-red-500">
                  <span>Descuento</span>
                  <span>-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-100">
                <span>Total</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
            </div>
          </div>

          {/* Status actions */}
          {actions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avanzar estado</h2>
              <div className="space-y-2">
                {actions.map(({ label, value, color }) => (
                  <button
                    key={value}
                    onClick={() => updateStatus(value)}
                    disabled={updating}
                    className={cn("w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50", color)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* WhatsApp — notificaciones al paciente */}
          {sale.patients?.phone && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notificar</h2>

              {sale.status === "listo" && (
                <WhatsAppButton
                  to={sale.patients.phone}
                  message={`Hola ${sale.patients.first_name}! Tu pedido está listo para retirar en ${businessName || "la óptica"}. ¡Te esperamos!`}
                  label="Avisar que está listo"
                  variant="solid"
                />
              )}

              {invoice && (
                <WhatsAppButton
                  to={sale.patients.phone}
                  message={`Hola ${sale.patients.first_name}! Te enviamos el resumen de tu factura N° ${invoice.invoice_number} de ${businessName || "la óptica"}.\n\nTotal: $${Number(invoice.total).toLocaleString("es-AR")}\n\nGracias por tu compra! 🙏`}
                  label="Enviar resumen de factura"
                  variant="outline"
                />
              )}

              <p className="text-[10px] text-gray-400">WhatsApp al {sale.patients.phone}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
