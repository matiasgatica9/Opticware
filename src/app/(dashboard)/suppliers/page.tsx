import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/lib/get-tenant"
import Link from "next/link"
import { Plus, Truck, Phone, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORY_LABELS: Record<string, string> = {
  armazones:    "Armazones",
  lentes:       "Lentes",
  contactologia:"Contactología",
  accesorios:   "Accesorios",
  sol:          "Sol",
  laboratorio:  "Laboratorio",
  otro:         "Otro",
}

const CATEGORY_COLORS: Record<string, string> = {
  armazones:    "bg-purple-50 text-purple-700",
  lentes:       "bg-blue-50 text-blue-700",
  contactologia:"bg-cyan-50 text-cyan-700",
  accesorios:   "bg-amber-50 text-amber-700",
  sol:          "bg-orange-50 text-orange-700",
  laboratorio:  "bg-rose-50 text-rose-700",
  otro:         "bg-gray-100 text-gray-500",
}

export default async function SuppliersPage() {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) return null

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("name")

  const all = suppliers ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-500 mt-0.5">{all.length} proveedor{all.length !== 1 ? "es" : ""}</p>
        </div>
        <Link
          href="/suppliers/new"
          className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          <Plus size={15} />
          Nuevo proveedor
        </Link>
      </div>

      {all.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 text-center">
          <Truck size={36} className="text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">No hay proveedores cargados</p>
          <p className="text-xs text-gray-400 mt-1">Agregá tus proveedores para tenerlos a mano</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {all.map(s => (
            <Link
              key={s.id}
              href={`/suppliers/${s.id}`}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors truncate">
                    {s.name}
                  </p>
                  {s.contact_name && (
                    <p className="text-xs text-gray-500 mt-0.5">{s.contact_name}</p>
                  )}
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", CATEGORY_COLORS[s.category ?? "otro"])}>
                  {CATEGORY_LABELS[s.category ?? "otro"]}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-1.5">
                {s.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone size={11} className="text-gray-400" />
                    {s.phone}
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail size={11} className="text-gray-400" />
                    <span className="truncate">{s.email}</span>
                  </div>
                )}
              </div>

              {s.notes && (
                <p className="mt-3 text-xs text-gray-400 line-clamp-2">{s.notes}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
