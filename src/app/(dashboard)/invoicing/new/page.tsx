"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, AlertTriangle, Info, Search, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

const IVA_RATE = 0.21

interface Item { description: string; quantity: number; unit_price: number; product_id?: string | null }
interface Patient { id: string; first_name: string; last_name: string; dni: string | null; obra_social_id: string | null }
interface Product { id: string; name: string; price: number; stock: number; category: string | null; sku: string | null }
interface ObraSocial { id: string; name: string; code: string | null; discount_percent: number; copago: number }

const METHOD_OPTIONS = [
  { value: "efectivo",      label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "mercadopago",   label: "MercadoPago" },
  { value: "credito",       label: "Tarjeta crédito" },
  { value: "debito",        label: "Tarjeta débito" },
  { value: "obra_social",   label: "Obra social" },
]

export default function NewInvoicePage() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const saleId      = searchParams.get("sale_id")
  const fromSales   = searchParams.get("from") === "sales"

  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [tenantData, setTenantData] = useState<any>(null)

  // Formulario factura
  const [tipo, setTipo]               = useState<"A"|"B"|"C">("B")
  const [clientName, setClientName]   = useState("")
  const [clientCuit, setClientCuit]   = useState("")
  const [condition, setCondition]     = useState("consumidor_final")
  const [includesIva, setIncludesIva] = useState(true)
  const [items, setItems]             = useState<Item[]>([{ description: "", quantity: 1, unit_price: 0 }])
  const [linkedSaleId, setLinkedSaleId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("efectivo")

  // Búsqueda de paciente
  const [patients, setPatients]           = useState<Patient[]>([])
  const [patientQuery, setPatientQuery]   = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showPatientDD, setShowPatientDD] = useState(false)

  // Búsqueda de productos
  const [products, setProducts]           = useState<Product[]>([])
  const [productQuery, setProductQuery]   = useState("")
  const [showProductDD, setShowProductDD] = useState(false)

  // Obras Sociales
  const [obrasSociales, setObrasSociales]   = useState<ObraSocial[]>([])
  const [selectedOS, setSelectedOS]         = useState<ObraSocial | null>(null)

  // Factura C → IVA deshabilitado por ley
  const ivaLocked = tipo === "C"
  const ivaActive = !ivaLocked && includesIva

  useEffect(() => {
    if (ivaLocked) setIncludesIva(false)
    else if (tipo !== "C") setIncludesIva(true)
  }, [tipo])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: ud } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
      if (!ud) return

      const [tenantRes, patientsRes, productsRes, osRes] = await Promise.all([
        supabase.from("tenants").select("id, afip_punto_venta").eq("id", ud.tenant_id).single(),
        supabase.from("patients").select("id,first_name,last_name,dni,obra_social_id").eq("tenant_id", ud.tenant_id).eq("active", true).order("last_name"),
        supabase.from("products").select("id,name,price,stock,category,sku").eq("tenant_id", ud.tenant_id).eq("active", true).order("name"),
        supabase.from("obras_sociales").select("id,name,code,discount_percent,copago").eq("tenant_id", ud.tenant_id).eq("active", true).order("name"),
      ])
      setTenantData(tenantRes.data)
      setPatients(patientsRes.data ?? [])
      setProducts(productsRes.data ?? [])
      setObrasSociales(osRes.data ?? [])

      // Pre-llenar desde venta si viene con ?sale_id=
      if (saleId) {
        setLinkedSaleId(saleId)
        const { data: sale } = await supabase
          .from("sales")
          .select("*, patients(id, first_name, last_name, dni), sale_items(*, products(name))")
          .eq("id", saleId)
          .single()
        if (sale) {
          if (sale.patients) {
            const p = sale.patients as any
            setClientName(`${p.last_name}, ${p.first_name}`)
            setSelectedPatient(p)
          }
          if (sale.payment_method) setPaymentMethod(sale.payment_method)
          const saleItems: Item[] = (sale.sale_items ?? []).map((si: any) => ({
            description: si.products?.name ?? "Producto",
            quantity:    si.quantity,
            unit_price:  Number(si.unit_price),
          }))
          if (saleItems.length > 0) setItems(saleItems)
        }
      }
    }
    load()
  }, [saleId])

  const filteredPatients = patients.filter(p => {
    const q = patientQuery.toLowerCase()
    return p.first_name.toLowerCase().includes(q) || p.last_name.toLowerCase().includes(q) || (p.dni ?? "").includes(q)
  }).slice(0, 8)

  function selectPatient(p: Patient) {
    setSelectedPatient(p)
    setClientName(`${p.last_name}, ${p.first_name}`)
    setClientCuit(p.dni ?? "")
    setShowPatientDD(false)
    setPatientQuery("")
    // Auto-seleccionar obra social del paciente
    if (p.obra_social_id) {
      const os = obrasSociales.find(o => o.id === p.obra_social_id) ?? null
      if (os) setSelectedOS(os)
    }
  }

  const filteredProducts = products.filter(p => {
    const q = productQuery.toLowerCase()
    return p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q)
  }).slice(0, 10)

  function addProductItem(p: Product) {
    // Reemplazar último ítem vacío o agregar nuevo
    setItems(prev => {
      const last = prev[prev.length - 1]
      if (last && !last.description.trim() && last.unit_price === 0) {
        return [...prev.slice(0, -1), { description: p.name, quantity: 1, unit_price: Number(p.price), product_id: p.id }]
      }
      return [...prev, { description: p.name, quantity: 1, unit_price: Number(p.price), product_id: p.id }]
    })
    setProductQuery("")
    setShowProductDD(false)
  }

  // Cálculos
  const subtotal        = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const discountAmount  = selectedOS && selectedOS.discount_percent > 0
    ? Math.round(subtotal * (selectedOS.discount_percent / 100) * 100) / 100
    : 0
  const subtotalAfterDiscount = subtotal - discountAmount
  const ivaAmount       = ivaActive ? Math.round(subtotalAfterDiscount * IVA_RATE * 100) / 100 : 0
  const total           = subtotalAfterDiscount + ivaAmount

  function updateItem(idx: number, field: keyof Item, value: string | number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }
  function addItem() { setItems(prev => [...prev, { description: "", quantity: 1, unit_price: 0 }]) }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  function formatInvoiceNum(puntoVenta: string | number, num: number) {
    const pv = String(puntoVenta).padStart(4, "0")
    return `${pv}-${String(num).padStart(8, "0")}`
  }

  async function handleEmit() {
    if (!clientName.trim()) { setError("El nombre del cliente es requerido"); return }
    if (items.some(i => !i.description.trim())) { setError("Completá la descripción de todos los ítems"); return }
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Obtener próximo número atómicamente
    const { data: nextNum } = await supabase.rpc("next_invoice_number", {
      p_tenant_id: tenantData.id,
      p_tipo:      tipo,
    })

    const invoiceNumber = formatInvoiceNum(tenantData.afip_punto_venta ?? 1, nextNum)

    // ── 1. Crear la venta si no viene de una existente ──────────────────
    let activeSaleId = linkedSaleId
    if (!activeSaleId) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: newSale, error: saleErr } = await supabase
        .from("sales")
        .insert({
          tenant_id:      tenantData.id,
          patient_id:     selectedPatient?.id ?? null,
          status:         "entregado",
          payment_method: paymentMethod,
          subtotal,
          discount:       discountAmount,
          total,
          created_by:     user?.id ?? null,
        })
        .select("id")
        .single()

      if (saleErr || !newSale) {
        setError("Error al registrar la venta")
        setLoading(false)
        return
      }
      activeSaleId = newSale.id

      // Insertar sale_items
      const saleItemsToInsert = items
        .filter(i => i.description.trim())
        .map(i => ({
          sale_id:    activeSaleId,
          tenant_id:  tenantData.id,
          product_id: i.product_id ?? null,
          quantity:   i.quantity,
          unit_price: i.unit_price,
          subtotal:   i.quantity * i.unit_price,
        }))
      if (saleItemsToInsert.length > 0) {
        await supabase.from("sale_items").insert(saleItemsToInsert)
      }
    }

    // ── 2. Crear la factura ──────────────────────────────────────────────
    const { data: invoice, error: err } = await supabase
      .from("invoices")
      .insert({
        tenant_id:        tenantData.id,
        sale_id:          activeSaleId ?? null,
        patient_id:       selectedPatient?.id ?? null,
        invoice_number:   invoiceNumber,
        invoice_type:     tipo,
        client_name:      clientName.trim(),
        client_cuit:      clientCuit.trim() || null,
        client_condition: condition,
        includes_iva:     ivaActive,
        subtotal,
        discount_amount:  discountAmount,
        iva_amount:       ivaAmount,
        total,
        payment_method:   paymentMethod,
        obra_social_id:   selectedOS?.id ?? null,
        afip_status:      "emitida",
      })
      .select("id")
      .single()

    if (err || !invoice) {
      setError("Error al emitir la factura")
      setLoading(false)
      return
    }

    // Vincular invoice_id en la venta
    await supabase.from("sales").update({ invoice_id: invoice.id }).eq("id", activeSaleId!)

    // ── 3. Guardar invoice_items ─────────────────────────────────────────
    const invoiceItemsToInsert = items
      .filter(i => i.description.trim())
      .map(i => ({
        invoice_id:  invoice.id,
        tenant_id:   tenantData.id,
        product_id:  i.product_id ?? null,
        description: i.description,
        quantity:    i.quantity,
        unit_price:  i.unit_price,
        subtotal:    i.quantity * i.unit_price,
      }))
    if (invoiceItemsToInsert.length > 0) {
      await supabase.from("invoice_items").insert(invoiceItemsToInsert)
    }

    // ── 4. Decrementar stock ─────────────────────────────────────────────
    const productItems = items.filter(i => i.product_id && i.quantity > 0)
    for (const item of productItems) {
      await supabase.rpc("decrement_stock", {
        p_product_id: item.product_id,
        p_quantity:   item.quantity,
      })
    }

    router.push(`/invoicing/${invoice.id}`)
  }

  const backHref = fromSales ? "/sales" : "/invoicing"

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Nueva {fromSales ? "venta / " : ""}factura</h1>
          {linkedSaleId && <p className="text-sm text-emerald-700">Pre-llenado desde venta</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">

          {/* Tipo de comprobante */}
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
            <p className="text-xs text-gray-400">
              {tipo === "A" && "Responsable inscripto → responsable inscripto. Requiere CUIT."}
              {tipo === "B" && "Responsable inscripto → consumidor final / exento."}
              {tipo === "C" && "Monotributista → cualquier cliente. Sin IVA discriminado."}
            </p>
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

          {/* Paciente (opcional) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Paciente <span className="font-normal text-gray-400">(opcional)</span></h2>
            {selectedPatient ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <p className="text-sm font-medium text-emerald-800">
                  {selectedPatient.last_name}, {selectedPatient.first_name}
                  {selectedPatient.dni && <span className="text-emerald-600 font-normal ml-2 text-xs">DNI {selectedPatient.dni}</span>}
                </p>
                <button
                  type="button"
                  onClick={() => { setSelectedPatient(null); setClientName("") }}
                  className="text-emerald-400 hover:text-emerald-600"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                  <Search size={13} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={patientQuery}
                    onChange={e => { setPatientQuery(e.target.value); setShowPatientDD(true) }}
                    onFocus={() => setShowPatientDD(true)}
                    onBlur={() => setTimeout(() => setShowPatientDD(false), 150)}
                    placeholder="Buscar paciente por nombre o DNI..."
                    className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                  />
                </div>
                {showPatientDD && patientQuery && filteredPatients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                    {filteredPatients.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={() => selectPatient(p)}
                        className="w-full flex justify-between px-3 py-2 hover:bg-gray-50 text-left text-sm"
                      >
                        <span className="text-gray-800">{p.last_name}, {p.first_name}</span>
                        {p.dni && <span className="text-gray-400 text-xs">{p.dni}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cliente */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Datos del cliente</h2>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Nombre / Razón social *</label>
              <input
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Ej: García, Juan Carlos"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">CUIT / CUIL{tipo === "A" ? " *" : ""}</label>
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
                  <option value="consumidor_final">Consumidor final</option>
                  <option value="responsable_inscripto">Responsable inscripto</option>
                  <option value="monotributista">Monotributista</option>
                  <option value="exento">Exento</option>
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

            {/* Buscador de productos del stock */}
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
              {showProductDD && (productQuery || true) && filteredProducts.length > 0 && showProductDD && productQuery && (
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

            {/* Encabezado columnas */}
            {items.some(i => i.description) && (
              <div className="grid grid-cols-12 gap-2 px-0.5">
                <div className="col-span-6 text-xs text-gray-400">Descripción</div>
                <div className="col-span-2 text-xs text-gray-400 text-center">Cant.</div>
                <div className="col-span-3 text-xs text-gray-400 text-right">Precio unit.</div>
                <div className="col-span-1" />
              </div>
            )}

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <input
                      value={item.description}
                      onChange={e => updateItem(idx, "description", e.target.value)}
                      placeholder="Descripción del producto/servicio"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number" min={1}
                      value={item.quantity}
                      onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                      placeholder="Cant."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number" min={0} step={0.01}
                      value={item.unit_price}
                      onChange={e => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)}
                      placeholder="Precio"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addItem}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
            >
              + Agregar ítem manualmente
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Resumen</h2>

            {/* Obra social */}
            {obrasSociales.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Obra social</label>
                <select
                  value={selectedOS?.id ?? ""}
                  onChange={e => {
                    const found = obrasSociales.find(o => o.id === e.target.value) ?? null
                    setSelectedOS(found)
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="">Sin obra social</option>
                  {obrasSociales.map(os => (
                    <option key={os.id} value={os.id}>
                      {os.name}{os.discount_percent > 0 ? ` (${os.discount_percent}% desc.)` : ""}
                    </option>
                  ))}
                </select>
                {selectedOS && selectedOS.discount_percent > 0 && (
                  <p className="text-xs text-emerald-700 mt-1 font-medium">
                    Se aplicará {selectedOS.discount_percent}% de descuento
                  </p>
                )}
                {selectedOS && selectedOS.copago > 0 && (
                  <p className="text-xs text-amber-600 mt-0.5">
                    Copago del paciente: ${selectedOS.copago.toLocaleString("es-AR")}
                  </p>
                )}
              </div>
            )}

            {/* Forma de pago */}
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
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-700 font-medium">
                  <span>Desc. obra social ({selectedOS?.discount_percent}%)</span>
                  <span>− {formatCurrency(discountAmount)}</span>
                </div>
              )}
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
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-1">
                <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">Comprobante exento · sin discriminación de IVA</p>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              onClick={handleEmit}
              disabled={loading}
              className={cn(
                "w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
                ivaActive
                  ? "bg-emerald-700 text-white hover:bg-emerald-800"
                  : "bg-gray-500 text-white hover:bg-gray-600"
              )}
            >
              {loading ? "Emitiendo..." : "Emitir factura"}
            </button>

            {ivaActive && (
              <p className="text-[10px] text-gray-400 text-center">
                * La validación AFIP estará disponible próximamente
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
