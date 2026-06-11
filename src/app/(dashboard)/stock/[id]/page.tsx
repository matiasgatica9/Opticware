"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, Plus, Minus, Save, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

const CATEGORY_LABELS: Record<string, string> = {
  armazones:     "Armazones",
  lentes:        "Lentes",
  contactologia: "Contactología",
  accesorios:    "Accesorios",
  sol:           "Sol",
  otro:          "Otro",
}

export default function ProductDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adjustQty, setAdjustQty] = useState(1)
  const [adjustNote, setAdjustNote] = useState("")

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("products").select("*").eq("id", id).single()
      setProduct(data)
      setForm(data ?? {})
      setLoading(false)
    }
    load()
  }, [id])

  async function addStock() {
    if (adjustQty < 1) return
    setSaving(true)
    const supabase = createClient()
    const newStock = product.stock + adjustQty
    await supabase.from("products").update({ stock: newStock }).eq("id", id)
    setProduct((p: any) => ({ ...p, stock: newStock }))
    setForm((f: any) => ({ ...f, stock: newStock }))
    setAdjustQty(1)
    setAdjustNote("")
    setSaving(false)
  }

  async function removeStock() {
    if (adjustQty < 1) return
    setSaving(true)
    const supabase = createClient()
    const newStock = Math.max(0, product.stock - adjustQty)
    await supabase.from("products").update({ stock: newStock }).eq("id", id)
    setProduct((p: any) => ({ ...p, stock: newStock }))
    setForm((f: any) => ({ ...f, stock: newStock }))
    setAdjustQty(1)
    setAdjustNote("")
    setSaving(false)
  }

  async function saveEdit() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from("products").update({
      name:      form.name,
      category:  form.category,
      sku:       form.sku || null,
      price:     parseFloat(form.price) || 0,
      cost:      form.cost ? parseFloat(form.cost) : null,
      stock_min: parseInt(form.stock_min) || 0,
    }).eq("id", id)
    setProduct((p: any) => ({ ...p, ...form }))
    setEditing(false)
    setSaving(false)
  }

  async function archiveProduct() {
    if (!confirm("¿Archivar este producto? Ya no aparecerá en el listado ni en ventas.")) return
    const supabase = createClient()
    await supabase.from("products").update({ active: false }).eq("id", id)
    router.push("/stock")
  }

  if (loading) return <div className="h-40 flex items-center justify-center text-sm text-gray-400">Cargando...</div>
  if (!product) return <div className="text-sm text-gray-500">Producto no encontrado.</div>

  const isLow = product.stock <= product.stock_min
  const margin = product.cost && product.price > 0
    ? Math.round(((product.price - product.cost) / product.price) * 100)
    : null

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/stock" className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={15} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">{product.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400">{CATEGORY_LABELS[product.category]}</span>
            {product.sku && <span className="text-xs font-mono text-gray-400">· {product.sku}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors"
              >
                <Save size={12} />
                Guardar
              </button>
              <button
                onClick={() => { setEditing(false); setForm(product) }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left col — info + edit */}
        <div className="col-span-2 space-y-4">
          {/* Info / Edit */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Información</h2>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                  <input
                    value={form.name ?? ""}
                    onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                    <select
                      value={form.category ?? ""}
                      onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    >
                      <option value="armazones">Armazones</option>
                      <option value="lentes">Lentes</option>
                      <option value="contactologia">Contactología</option>
                      <option value="accesorios">Accesorios</option>
                      <option value="sol">Sol</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
                    <input
                      value={form.sku ?? ""}
                      onChange={e => setForm((f: any) => ({ ...f, sku: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Precio venta</label>
                    <input
                      type="number" min={0} step={0.01}
                      value={form.price ?? 0}
                      onChange={e => setForm((f: any) => ({ ...f, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Costo</label>
                    <input
                      type="number" min={0} step={0.01}
                      value={form.cost ?? ""}
                      onChange={e => setForm((f: any) => ({ ...f, cost: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Stock mínimo</label>
                    <input
                      type="number" min={0}
                      value={form.stock_min ?? 5}
                      onChange={e => setForm((f: any) => ({ ...f, stock_min: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-gray-400">Categoría</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{CATEGORY_LABELS[product.category]}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">SKU</dt>
                  <dd className="font-mono text-gray-700 mt-0.5">{product.sku ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Precio de venta</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{formatCurrency(product.price)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Costo</dt>
                  <dd className="font-medium text-gray-700 mt-0.5">{product.cost ? formatCurrency(product.cost) : "—"}</dd>
                </div>
                {margin !== null && (
                  <div>
                    <dt className="text-xs text-gray-400">Margen</dt>
                    <dd className="font-medium text-emerald-700 mt-0.5">{margin}%</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-gray-400">Stock mínimo</dt>
                  <dd className="font-medium text-gray-700 mt-0.5">{product.stock_min} unidades</dd>
                </div>
              </dl>
            )}
          </div>

          {/* Stock adjustment */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ajuste de inventario</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setAdjustQty(q => Math.max(1, q - 1))}
                  className="w-8 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Minus size={13} />
                </button>
                <input
                  type="number"
                  min={1}
                  value={adjustQty}
                  onChange={e => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center text-sm font-medium text-gray-900 focus:outline-none border-x border-gray-200 h-9"
                />
                <button
                  onClick={() => setAdjustQty(q => q + 1)}
                  className="w-8 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={13} />
                </button>
              </div>

              <button
                onClick={addStock}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors"
              >
                <Plus size={13} />
                Agregar
              </button>
              <button
                onClick={removeStock}
                disabled={saving || adjustQty > product.stock}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <Minus size={13} />
                Retirar
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Stock actual: <span className={cn("font-semibold", isLow ? "text-amber-600" : "text-gray-700")}>{product.stock} unidades</span>
              {isLow && " · ⚠ Por debajo del mínimo"}
            </p>
          </div>
        </div>

        {/* Right col — stock card + danger zone */}
        <div className="space-y-4">
          <div className={cn(
            "rounded-xl border p-5 text-center",
            product.stock === 0
              ? "bg-red-50 border-red-100"
              : isLow
              ? "bg-amber-50 border-amber-100"
              : "bg-emerald-50 border-emerald-100"
          )}>
            <p className={cn("text-xs font-medium mb-1",
              product.stock === 0 ? "text-red-500" : isLow ? "text-amber-600" : "text-emerald-600"
            )}>
              {product.stock === 0 ? "Sin stock" : isLow ? "Stock bajo" : "En stock"}
            </p>
            <p className={cn("text-4xl font-bold",
              product.stock === 0 ? "text-red-700" : isLow ? "text-amber-700" : "text-emerald-700"
            )}>
              {product.stock}
            </p>
            <p className={cn("text-xs mt-1",
              product.stock === 0 ? "text-red-400" : isLow ? "text-amber-500" : "text-emerald-500"
            )}>
              unidades
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-medium text-gray-500">Valor en inventario</p>
            <p className="text-lg font-bold text-gray-900">
              {product.cost ? formatCurrency(product.cost * product.stock) : "—"}
            </p>
            <p className="text-xs text-gray-400">{product.stock} u. × {product.cost ? formatCurrency(product.cost) : "sin costo"}</p>
          </div>

          <button
            onClick={archiveProduct}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-100 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors"
          >
            <Trash2 size={12} />
            Archivar producto
          </button>
        </div>
      </div>
    </div>
  )
}
