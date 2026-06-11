import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Plus, Package, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import StockFilters from "@/components/stock/StockFilters"

const CATEGORY_LABELS: Record<string, string> = {
  armazones:    "Armazones",
  lentes:       "Lentes",
  contactologia: "Contactología",
  accesorios:   "Accesorios",
  sol:          "Sol",
  otro:         "Otro",
}

const CATEGORY_COLORS: Record<string, string> = {
  armazones:    "bg-purple-50 text-purple-700",
  lentes:       "bg-blue-50 text-blue-700",
  contactologia:"bg-cyan-50 text-cyan-700",
  accesorios:   "bg-amber-50 text-amber-700",
  sol:          "bg-orange-50 text-orange-700",
  otro:         "bg-gray-100 text-gray-500",
}

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
  if (!userData) return null

  let query = supabase
    .from("products")
    .select("*")
    .eq("tenant_id", userData.tenant_id)
    .eq("active", true)
    .order("name")

  if (category) query = query.eq("category", category)

  const { data: products } = await query

  const all = products ?? []
  const lowStock = all.filter(p => p.stock <= p.stock_min)
  const totalValue = all.reduce((sum, p) => sum + (p.cost ?? 0) * p.stock, 0)

  // Conteo por categoría
  const byCategory = Object.keys(CATEGORY_LABELS).reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = all.filter(p => p.category === cat).length
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Stock</h1>
          <p className="text-sm text-gray-500 mt-0.5">{all.length} producto{all.length !== 1 ? "s" : ""} activo{all.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/stock/new"
          className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          <Plus size={15} />
          Nuevo producto
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400">Productos activos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{all.length}</p>
        </div>
        <div className={cn("rounded-xl border p-4", lowStock.length > 0 ? "bg-red-50 border-red-100" : "bg-white border-gray-100")}>
          <div className="flex items-center gap-1.5">
            {lowStock.length > 0 && <AlertTriangle size={13} className="text-red-500" />}
            <p className={cn("text-xs", lowStock.length > 0 ? "text-red-500" : "text-gray-400")}>Stock bajo</p>
          </div>
          <p className={cn("text-2xl font-bold mt-1", lowStock.length > 0 ? "text-red-700" : "text-gray-900")}>{lowStock.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400">Valor de inventario</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Alerta stock bajo */}
      {lowStock.length > 0 && !category && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">
                {lowStock.length} producto{lowStock.length !== 1 ? "s" : ""} con stock bajo o agotado
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {lowStock.slice(0, 6).map(p => (
                  <Link
                    key={p.id}
                    href={`/stock/${p.id}`}
                    className="text-xs bg-white border border-red-200 text-red-700 px-2 py-0.5 rounded-full hover:bg-red-100 transition-colors"
                  >
                    {p.name} ({p.stock})
                  </Link>
                ))}
                {lowStock.length > 6 && (
                  <span className="text-xs text-red-400">+{lowStock.length - 6} más</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters + Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 overflow-x-auto">
          <StockFilters current={category} byCategory={byCategory} />
        </div>

        {all.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package size={32} className="text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">No hay productos</p>
            <p className="text-xs text-gray-400 mt-1">
              {category ? "Probá con otra categoría" : `Hacé clic en "Nuevo producto" para agregar el primero`}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Producto</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Categoría</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">SKU</th>
                <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Stock</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Precio venta</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Costo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {all.map(product => {
                const isLow = product.stock <= product.stock_min
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/stock/${product.id}`} className="font-medium text-gray-900 hover:text-emerald-700 transition-colors">
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", CATEGORY_COLORS[product.category])}>
                        {CATEGORY_LABELS[product.category]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs font-mono">
                      {product.sku ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        product.stock === 0
                          ? "bg-red-100 text-red-700"
                          : isLow
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      )}>
                        {product.stock}
                      </span>
                      {isLow && (
                        <span className="ml-1 text-[10px] text-gray-400">/ mín {product.stock_min}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-900 font-medium">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-400 text-xs">
                      {product.cost ? formatCurrency(product.cost) : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
