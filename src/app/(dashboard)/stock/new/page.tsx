"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const schema = z.object({
  name:      z.string().min(1, "Requerido"),
  category:  z.enum(["armazones","lentes","contactologia","accesorios","sol","otro"]),
  sku:       z.string().optional(),
  price:     z.coerce.number().min(0, "Debe ser ≥ 0"),
  cost:      z.coerce.number().min(0).optional(),
  stock:     z.coerce.number().int().min(0).default(0),
  stock_min: z.coerce.number().int().min(0).default(5),
})

type FormData = z.infer<typeof schema>

function inp(hasError: boolean) {
  return `w-full px-3 py-2 border rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${hasError ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-emerald-600"}`
}

function Field({ label, error, children, hint }: { label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function NewProductPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "armazones", stock: 0, stock_min: 5, price: 0 },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Error al guardar el producto"); setLoading(false); return }
      router.push(`/stock/${json.id}`)
    } catch {
      setError("Error de conexión")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/stock" className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Nuevo producto</h1>
          <p className="text-sm text-gray-500">Agregá un artículo al inventario</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Identificación */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Identificación</h2>

          <Field label="Nombre *" error={errors.name?.message}>
            <input {...register("name")} placeholder="Ej: Ray-Ban RB3025 Aviador" className={inp(!!errors.name)} />
          </Field>

          <Field label="Categoría *" error={errors.category?.message}>
            <select {...register("category")} className={inp(!!errors.category)}>
              <option value="armazones">Armazones</option>
              <option value="lentes">Lentes</option>
              <option value="contactologia">Contactología</option>
              <option value="accesorios">Accesorios</option>
              <option value="sol">Sol</option>
              <option value="otro">Otro</option>
            </select>
          </Field>

          <Field label="SKU / Código" error={errors.sku?.message} hint="Código interno o de barras (opcional)">
            <input {...register("sku")} placeholder="Ej: RB-3025-001" className={inp(!!errors.sku)} />
          </Field>
        </div>

        {/* Precios */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Precios</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio de venta *" error={errors.price?.message}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input {...register("price")} type="number" min={0} step={0.01} placeholder="0" className={`${inp(!!errors.price)} pl-6`} />
              </div>
            </Field>
            <Field label="Costo" error={errors.cost?.message} hint="Para calcular margen">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input {...register("cost")} type="number" min={0} step={0.01} placeholder="0" className={`${inp(!!errors.cost)} pl-6`} />
              </div>
            </Field>
          </div>
        </div>

        {/* Stock */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Inventario</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Stock inicial" error={errors.stock?.message}>
              <input {...register("stock")} type="number" min={0} step={1} placeholder="0" className={inp(!!errors.stock)} />
            </Field>
            <Field label="Stock mínimo" error={errors.stock_min?.message} hint="Alerta de stock bajo">
              <input {...register("stock_min")} type="number" min={0} step={1} placeholder="5" className={inp(!!errors.stock_min)} />
            </Field>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors">
            {loading ? "Guardando..." : "Guardar producto"}
          </button>
          <Link href="/stock" className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
