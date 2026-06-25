import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/lib/get-tenant"
import Link from "next/link"
import { Plus, ShoppingCart, Pencil } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import WhatsAppButton from "@/components/WhatsAppButton"

const TYPE_STYLES: Record<string, string> = {
  A: "bg-blue-50 text-blue-700",
  B: "bg-emerald-50 text-emerald-700",
  C: "bg-purple-50 text-purple-700",
}

const STATUS_STYLES: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-500",
  emitida:  "bg-emerald-50 text-emerald-700",
}
const STATUS_LABELS: Record<string, string> = {
  borrador: "Borrador",
  emitida:  "Emitida",
}

const METHOD_LABELS: Record<string, string> = {
  efectivo:      "Efectivo",
  transferencia: "Transferencia",
  mercadopago:   "MercadoPago",
  obra_social:   "Obra social",
  credito:       "Tarj. crédito",
  debito:        "Tarj. débito",
}

export default async function SalesPage() {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) return null

  const [{ data: invoices }, { data: labSales }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, patients(first_name, last_name, phone)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("sales")
      .select("*, patients(first_name, last_name, phone)")
      .eq("tenant_id", tenantId)
      .eq("source", "lab_order")
      .order("created_at", { ascending: false })
      .limit(200),
  ])

  const all = invoices ?? []
  const totalAmount = all.reduce((s, i) => s + (i.total ?? 0), 0)
  const labSalesAll = labSales ?? []
  const labSalesTotal = labSalesAll.reduce((s, i) => s + (i.total ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Ventas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {all.length} comprobante{all.length !== 1 ? "s" : ""} · {formatCurrency(totalAmount)}
          </p>
        </div>
        <Link
          href="/invoicing/new?from=sales"
          className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          <Plus size={15} />
          Nueva venta
        </Link>
      </div>

      {/* Stats por tipo */}
      <div className="grid grid-cols-3 gap-3">
        {(["A", "B", "C"] as const).map(tipo => {
          const count   = all.filter(i => i.invoice_type === tipo).length
          const subtot  = all.filter(i => i.invoice_type === tipo).reduce((s, i) => s + (i.total ?? 0), 0)
          return (
            <div key={tipo} className={cn("rounded-xl border p-4", TYPE_STYLES[tipo])}>
              <p className="text-xs font-medium opacity-80">Factura {tipo}</p>
              <p className="text-2xl font-bold mt-1">{count}</p>
              <p className="text-xs opacity-70 mt-0.5">{formatCurrency(subtot)}</p>
            </div>
          )
        })}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {all.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingCart size={36} className="text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">Todavía no hay ventas</p>
            <p className="text-xs text-gray-400 mt-1">
              Hacé clic en "Nueva venta" para registrar la primera
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">N° Factura</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Pago</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Estado</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Fecha</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Total</th>
                <th className="w-24 px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {all.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-5 py-3">
                    <Link
                      href={`/invoicing/${inv.id}`}
                      className="font-mono font-medium text-gray-900 hover:text-emerald-700 transition-colors text-xs"
                    >
                      {inv.invoice_number ?? "—"}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-700 max-w-[160px] truncate">
                    {inv.client_name}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded",
                      TYPE_STYLES[inv.invoice_type] ?? "bg-gray-100 text-gray-600"
                    )}>
                      Fcta. {inv.invoice_type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {METHOD_LABELS[inv.payment_method] ?? inv.payment_method ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      STATUS_STYLES[inv.afip_status] ?? STATUS_STYLES.borrador
                    )}>
                      {STATUS_LABELS[inv.afip_status] ?? inv.afip_status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {formatDate(inv.created_at)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(inv.total)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(inv as any).patients?.phone && (
                        <WhatsAppButton
                          phone={(inv as any).patients.phone}
                          patientName={inv.client_name ?? `${(inv as any).patients.first_name} ${(inv as any).patients.last_name}`}
                          size="sm"
                          defaultTemplateIndex={2}
                          extraData={{ invoiceNumber: inv.invoice_number ?? "" }}
                        />
                      )}
                      <Link
                        href={`/invoicing/${inv.id}/edit`}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Editar"
                      >
                        <Pencil size={12} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ingresos de laboratorio */}
      {labSalesAll.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Ingresos de laboratorio</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {labSalesAll.length} trabajo{labSalesAll.length !== 1 ? "s" : ""} · {formatCurrency(labSalesTotal)}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Descripción</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Paciente</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Pago</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Fecha</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {labSalesAll.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-700 max-w-[200px] truncate">
                      {s.notes?.replace("Trabajo de laboratorio: ", "") ?? "Trabajo de laboratorio"}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {s.patients ? `${s.patients.first_name} ${s.patients.last_name}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {METHOD_LABELS[s.payment_method] ?? s.payment_method ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        s.status === "completada"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-yellow-50 text-yellow-700"
                      )}>
                        {s.status === "completada" ? "Pagado" : "Seña / Pendiente"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(s.created_at)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
