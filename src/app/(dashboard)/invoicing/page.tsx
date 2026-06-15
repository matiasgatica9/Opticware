import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/lib/get-tenant"
import Link from "next/link"
import { Plus, FileText } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  borrador:  "bg-gray-100 text-gray-500",
  emitida:   "bg-emerald-50 text-emerald-700",
}
const STATUS_LABELS: Record<string, string> = {
  borrador: "Borrador",
  emitida:  "Emitida",
}

export default async function InvoicingPage() {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) return null

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, sales(id, patients(first_name, last_name))")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(100)

  const all = invoices ?? []
  const totalEmitidas = all.filter(i => i.afip_status === "emitida").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Facturación</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalEmitidas} factura{totalEmitidas !== 1 ? "s" : ""} emitida{totalEmitidas !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/invoicing/new"
          className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          <Plus size={15} />
          Nueva factura
        </Link>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-3">
        {(["A","B","C"] as const).map(tipo => {
          const count = all.filter(i => i.invoice_type === tipo && i.afip_status === "emitida").length
          const total = all.filter(i => i.invoice_type === tipo && i.afip_status === "emitida").reduce((s, i) => s + i.total, 0)
          return (
            <div key={tipo} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400">Factura {tipo}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(total)}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {all.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={32} className="text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">Todavía no hay facturas</p>
            <p className="text-xs text-gray-400 mt-1">Podés crear una desde acá o desde el detalle de una venta</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">N° Factura</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Estado</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Fecha</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {all.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/invoicing/${inv.id}`} className="font-mono font-medium text-gray-900 hover:text-emerald-700 transition-colors text-xs">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{inv.client_name}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      Fcta. {inv.invoice_type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_STYLES[inv.afip_status] ?? STATUS_STYLES.borrador)}>
                      {STATUS_LABELS[inv.afip_status] ?? inv.afip_status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(inv.created_at)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(inv.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
