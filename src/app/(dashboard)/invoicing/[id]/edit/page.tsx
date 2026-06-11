"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, AlertTriangle, Info, Check, Search } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

const IVA_RATE = 0.21

interface Item { description: string; quantity: number; unit_price: number }
interface Product { id: string; name: string; price: number; stock: number; category: string | null; sku: string | null }

const METHOD_OPTIONS = [
  { value: "efectivo",      label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "mercadopago",   label: "MercadoPago" },
  { value: "credito",       label: "Tarjeta crédito" },
  { value: "debito",        label: "Tarjeta débito" },
  { value: "obra_social",   label: "Obra social" },
]

const CONDITION_OPTIONS = [
  { value: "consumidor_final",      label: "Consumidor final" },
  { value: "responsable_inscripto", label: "Responsable inscripto" },
  { value: "monotributista",        label: "Monotributista" },
  { value: "exento",                label: "Exento" },
]

export default function EditInvoicePage() {
  const { id }  = useParams() as { id: string }
  const router  = useRouter()

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [invoice, setInvoice]         = useState<any>(null)

  // Productos
  const [products, setProducts]           = useState<Product[]>([])
  const [productQuery, setProductQuery]   = useState("")
  const [showProductDD, setShowProductDD] = useState(false)

  // Campos editables
  const [tipo, setTipo]               = useState<"A"|"B"|"C">("B")
  const [clientName, setClientName]   = useState("")
  const [clientCuit, setClientCuit]   = useState("")
  const [condition, setCondition]     = useState("consumidor_final")
  const [includesIva, setIncludesIva] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState("efectivo")
  const [afipStatus, setAfipStatus]   = useState("emitida")
  const [items, setItems]             = useState<Item[]>([{ description: "", quantity: 1, unit_price: 0 }])

  const ivaLocked = tipo === "C"
  const ivaActive = !ivaLocked && includesIva

  useEffect(() => {
    if (ivaLocked) setIncludesIva(false)
  }, [tipo])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: ud } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
      const [invResult, productsResult] = await Promise.all([
        supabase.from("invoices").select("*").eq("id", id).single(),
        ud ? supabase.from("products").select("id,name,price,stock,category,sku").eq("tenant_id", ud.tenant_id).eq("active", true).order("name") : Promise.resolve({ data: [] }),
      ])
      const inv = invResult.data
      if (!inv) { setPageLoading(false); return }
      setInvoice(inv)
      setProducts(productsResult.data ?? [])

      // Populate form
      setTipo(inv.invoice_type ?? "B")
      setClientName(inv.client_name ?? "")
      setClientCuit(inv.client_cuit ?? "")
      setCondition(inv.client_condition ?? "consumidor_final")
      setIncludesIva(inv.includes_iva ?? true)
      setPaymentMethod(inv.payment_method ?? "efectivo")
      setAfipStatus(inv.afip_status ?? "emitida")

      // Items: reconstruct from subtotal as single row if no breakdown
      setItems([{
        description: "Detalle de venta",
        quantity:    1,
        unit_price:  Number(inv.subtotal) || 0,
      }])

      setPageLoading(false)
    }
    load()
  }, [id])

  // Cálculos
  const subtotal  = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const ivaAmount = ivaActive ? Math.round(subtotal * IVA_RATE * 100) / 100 : 0
  const total     = subtotal + ivaAmount

  const filteredProducts = products.filter(p => {
    const q = productQuery.toLowerCase()
    return p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q)
  }).slice(0, 10)

  function addProductItem(p: Product) {
    setItems(prev => {
      const last = prev[prev.length - 1]
      if (last && !last.description.trim() && last.unit_price === 0) {
        return [...prev.slice(0, -1), { description: p.name, quantity: 1, unit_price: Number(p.price) }]
      }
      return [...prev, { description: p.name, quantity: 1, unit_price: Number(p.price) }]
    })
    setProductQuery("")
    setShowProductDD(false)
  }

  function updateItem(idx: number, field: keyof Item, value: string | number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }
  function addItem() { setItems(prev => [...prev, { description: "", quantity: 1, unit_price: 0 }]) }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  async function handleSave() {
    if (!clientName.trim()) { setError("El nombre del cliente es requerido"); return }
    if (items.some(i => !i.description.trim())) { setError("Completá la descripción de todos los ítems"); return }
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: err } = await supabase
      .from("invoices")
      .update({
        invoice_type:     tipo,
        client_name:      clientName.trim(),
        client_cuit:      clientCuit.trim() || null,
        client_condition: condition,
        includes_iva:     ivaActive,
        subtotal,
        iva_amount:       ivaAmount,
        total,
        payment_method:   paymentMethod,
        afip_status:      afipStatus,
      })
      .eq("id", id)

    if (err) {
      setError("Error al guardar los cambios")
      setSaving(false)
      return
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      router.push(`/invoicing/${id}`)
    }, 800)
  }

  if (pageLoading) {
    return <div className="h-40 flex items-center justify-center text-sm text-gray-400">Cargando...</div>
  }
  if (!invoice) {
    return <div className="text-sm text-gray-500">Factura no encontrada.</div>
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/invoicing/${id}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Editar factura {invoice.invoice_number}
          </h1>
          <p className="text-sm text-gray-400">Los cambios se guardan sobre el comprobante existente</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">

          {/* Tipo */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Tipo de comprobante</h2>
            <div className="flex gap-2">
              {(["A","B","C"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg text-sm font-bold border-2 transition-colors",
                    tipo === t
                      ? "bg-emerald-700 border-emerald-700 text-white"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  Factura {t}
                </button>
              ))}
            </div>
          </div>

          {/* IVA toggle */}
          <div className={cn(
            "rounded-xl border p-4 flex items-center justify-between",
            ivaLocked ? "bg-gray-50 border-gray-100" : "bg-white border-gray-100"
          )}>
            <div>
              <p className={cn("text-sm font-medium", ivaLocked ? "text-gray-400" : "text-gray-700")}>
                Discriminar IVA (21%)
              </p>
              {ivaLocked && (
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Info size={11} />
                  Los monotributistas no cobran IVA por ley
                </p>
              )}
            </div>
            <button
              onClick={() => !ivaLocked && setIncludesIva(v => !v)}
              disabled={ivaLocked}
              className={cn(
                "relative w-10 h-6 rounded-full transition-colors",
                ivaLocked ? "bg-gray-200 cursor-not-allowed"
                : ivaActive ? "bg-emerald-600" : "bg-gray-300"
              )}
            >
              <span className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                ivaActive && !ivaLocked ? "translate-x-4" : ""
              )} />
            </button>
          </div>

          {/* Cliente */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Datos del cliente</h2>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Nombre / Razón social *</label>
              <input
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">CUIT / CUIL</label>
                <input
                  value={clientCuit}
                  onChange={e => setClientCuit(e.target.value)}
                  placeholder="20-12345678-9"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Condición IVA</label>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                >
                  {CONDITION_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Detalle</h2>
              <span className="text-xs text-gray-400">Cant. · Precio unit.</span>
            </div>

            {/* Buscador de productos */}
            <div className="relative">
              <div className="flex items-center gap-2 border border-dashed border-emerald-300 bg-emerald-50 rounded-lg px-3 py-2">
                <Search size={13} className="text-emerald-500 flex-shrink-0" />
                <input
                  type="text"
                  value={productQuery}
                  onChange={e => { setProductQuery(e.target.value); setShowProductDD(true) }}
                  onFocus={() => setShowProductDD(true)}
                  onBlur={() => setTimeout(() => setShowProductDD(false), 150)}
                  placeholder="Buscar producto del stock para agregar..."
                  className="flex-1 text-sm text-gray-700 placeholder-emerald-400 outline-none bg-transparent"
                />
              </div>
              {showProductDD && productQuery && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                  {filteredProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={() => addProductItem(p)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <p className="text-sm text-gray-800 font-medium">{p.name}</p>
                        <p className="text-xs text-gray-400">
                          {p.category && <span>{p.category} · </span>}
                          Stock: {p.stock ?? 0} u.
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-700 ml-3 flex-shrink-0">
                        {formatCurrency(p.price)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <input
                      value={item.description}
                      onChange={e => updateItem(idx, "description", e.target.value)}
                      placeholder="Descripción"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number" min={1}
                      value={item.quantity}
                      onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number" min={0} step={0.01}
                      value={item.unit_price}
                      onChange={e => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="text-xs text-emerald-700 hover:text-emerald-800 font-medium transition-colors">
              + Agregar ítem manualmente
            </button>
          </div>

          {/* Estado */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Estado del comprobante</h2>
            <div className="flex gap-2">
              {([
                { value: "borrador", label: "Borrador",  cls: "bg-gray-100 text-gray-600 border-gray-200" },
                { value: "emitida",  label: "Emitida",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              ]).map(s => (
                <button
                  key={s.value}
                  onClick={() => setAfipStatus(s.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all",
                    afipStatus === s.value ? `${s.cls} ring-2 ring-offset-1 ring-emerald-400` : "border-gray-200 text-gray-400 hover:border-gray-300"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Resumen</h2>

            {/* Pago */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Forma de pago</label>
              <div className="space-y-1.5">
                {METHOD_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={value}
                      checked={paymentMethod === value}
                      onChange={() => setPaymentMethod(value)}
                      className="accent-emerald-700"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {ivaActive && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>IVA 21%</span>
                  <span>{formatCurrency(ivaAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {!ivaActive && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">Sin discriminación de IVA</p>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={cn(
                "w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2",
                saved
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-emerald-700 text-white hover:bg-emerald-800"
              )}
            >
              {saved ? <><Check size={14} /> Guardado</> : saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
