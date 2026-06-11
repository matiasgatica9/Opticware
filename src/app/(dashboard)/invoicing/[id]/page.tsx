"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, Printer, AlertTriangle, Pencil } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

const CONDITION_LABELS: Record<string, string> = {
  consumidor_final:      "Consumidor Final",
  responsable_inscripto: "Responsable Inscripto",
  monotributista:        "Monotributista",
  exento:                "IVA Exento",
}

export default function InvoiceDetailPage() {
  const { id } = useParams() as { id: string }
  const [invoice, setInvoice] = useState<any>(null)
  const [tenant, setTenant]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: ud } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
      const [invRes, tenantRes] = await Promise.all([
        supabase.from("invoices").select("*, sales(id), obras_sociales(name,discount_percent,copago)").eq("id", id).single(),
        supabase.from("tenants").select("business_name, logo_url, primary_color, punto_venta").eq("id", ud?.tenant_id).single(),
      ])
      setInvoice(invRes.data)
      setTenant(tenantRes.data)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="h-40 flex items-center justify-center text-sm text-gray-400">Cargando...</div>
  if (!invoice) return <div className="text-sm text-gray-500">Factura no encontrada.</div>

  return (
    <div className="max-w-2xl space-y-5">
      {/* Nav */}
      <div className="flex items-center gap-3 print:hidden">
        <Link href="/invoicing" className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={15} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">Factura {invoice.invoice_number}</h1>
          <p className="text-sm text-gray-500">{formatDate(invoice.created_at)}</p>
        </div>
        <Link
          href={`/invoicing/${id}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Pencil size={14} />
          Editar
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Printer size={14} />
          Imprimir
        </button>
        {invoice.sales?.id && (
          <Link
            href={`/sales/${invoice.sales.id}`}
            className="text-xs text-emerald-700 hover:underline"
          >
            Ver venta
          </Link>
        )}
      </div>

      {/* ── COMPROBANTE (imprimible) ── */}
      <div id="invoice-print" className="bg-white rounded-xl border border-gray-200 overflow-hidden print:rounded-none print:border-none print:shadow-none">
        {/* Encabezado */}
        <div className="grid grid-cols-3 border-b border-gray-200">
          {/* Datos emisor */}
          <div className="col-span-2 p-6 border-r border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              {tenant?.logo_url ? (
                <img src={tenant.logo_url} alt={tenant?.business_name} className="h-10 w-auto object-contain" />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: tenant?.primary_color ?? "#0F6E56" }}
                >
                  {tenant?.business_name?.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900 text-base">{tenant?.business_name}</p>
              </div>
            </div>
          </div>

          {/* Tipo de comprobante */}
          <div className="p-6 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full border-4 border-gray-800 flex items-center justify-center">
              <span className="text-2xl font-black text-gray-800">{invoice.invoice_type}</span>
            </div>
            <p className="text-xs font-semibold text-gray-600 mt-2 uppercase tracking-wide">
              Factura {invoice.invoice_type}
            </p>
            <p className="font-mono text-xs text-gray-500 mt-1">{invoice.invoice_number}</p>
          </div>
        </div>

        {/* Datos cliente */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 text-xs">Cliente:</span>
              <span className="font-semibold text-gray-900 ml-2">{invoice.client_name}</span>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Fecha:</span>
              <span className="font-medium text-gray-900 ml-2">{formatDate(invoice.created_at)}</span>
            </div>
            {invoice.client_cuit && (
              <div>
                <span className="text-gray-500 text-xs">CUIT/CUIL:</span>
                <span className="font-medium text-gray-900 ml-2">{invoice.client_cuit}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500 text-xs">Condición IVA:</span>
              <span className="font-medium text-gray-900 ml-2">
                {CONDITION_LABELS[invoice.client_condition] ?? invoice.client_condition}
              </span>
            </div>
          </div>
        </div>

        {/* Aviso exento */}
        {!invoice.includes_iva && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">Comprobante exento · sin discriminación de IVA</p>
          </div>
        )}

        {/* Totales */}
        <div className="p-6">
          {invoice.obras_sociales && (
            <div className="mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <span className="text-xs font-semibold text-emerald-700">Obra Social:</span>
              <span className="text-xs text-emerald-800">{invoice.obras_sociales.name}</span>
              {invoice.obras_sociales.discount_percent > 0 && (
                <span className="text-xs text-emerald-600 ml-auto">{invoice.obras_sociales.discount_percent}% descuento</span>
              )}
            </div>
          )}
          <div className="flex flex-col items-end gap-1.5 text-sm">
            <div className="flex justify-between w-56">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between w-56 text-emerald-700 font-medium">
                <span>Descuento obra social</span>
                <span>− {formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            {invoice.includes_iva && invoice.iva_amount > 0 && (
              <div className="flex justify-between w-56">
                <span className="text-gray-500">IVA 21%</span>
                <span className="font-medium">{formatCurrency(invoice.iva_amount)}</span>
              </div>
            )}
            <div className="flex justify-between w-56 pt-2 border-t border-gray-200 text-base font-bold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer comprobante */}
        <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between">
          <p className="text-[10px] text-gray-400">
            Comprobante generado por <span className="font-medium">OpticWare</span> · Desarrollado por VisualGest
          </p>
          <p className="text-[10px] text-gray-400">
            {invoice.afip_status === "emitida" ? "Emitido localmente" : invoice.afip_status}
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #invoice-print { display: block !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
