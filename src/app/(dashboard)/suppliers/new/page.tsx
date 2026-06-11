"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const schema = z.object({
  name:         z.string().min(1, "Requerido"),
  contact_name: z.string().optional(),
  phone:        z.string().optional(),
  email:        z.string().email("Email inválido").optional().or(z.literal("")),
  address:      z.string().optional(),
  category:     z.enum(["armazones","lentes","contactologia","accesorios","sol","laboratorio","otro"]),
  notes:        z.string().optional(),
})
type FormData = z.infer<typeof schema>

function inp(err: boolean) {
  return `w-full px-3 py-2 border rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${err ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-emerald-600"}`
}
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function NewSupplierPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "otro" },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }
    const { data: ud } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
    if (!ud) { setError("Error de sesión"); setLoading(false); return }

    const { data: sup, error: err } = await supabase
      .from("suppliers")
      .insert({
        tenant_id:    ud.tenant_id,
        name:         data.name,
        contact_name: data.contact_name || null,
        phone:        data.phone || null,
        email:        data.email || null,
        address:      data.address || null,
        category:     data.category,
        notes:        data.notes || null,
      })
      .select("id")
      .single()

    if (err || !sup) { setError("Error al guardar"); setLoading(false); return }
    router.push(`/suppliers/${sup.id}`)
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/suppliers" className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Nuevo proveedor</h1>
          <p className="text-sm text-gray-500">Agregá los datos de contacto</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Datos principales</h2>
          <Field label="Nombre *" error={errors.name?.message}>
            <input {...register("name")} placeholder="Ej: Laboratorio Óptico Central" className={inp(!!errors.name)} />
          </Field>
          <Field label="Categoría" error={errors.category?.message}>
            <select {...register("category")} className={inp(!!errors.category)}>
              <option value="armazones">Armazones</option>
              <option value="lentes">Lentes</option>
              <option value="contactologia">Contactología</option>
              <option value="accesorios">Accesorios</option>
              <option value="sol">Sol</option>
              <option value="laboratorio">Laboratorio</option>
              <option value="otro">Otro</option>
            </select>
          </Field>
          <Field label="Persona de contacto" error={errors.contact_name?.message}>
            <input {...register("contact_name")} placeholder="Ej: Carlos Rodríguez" className={inp(false)} />
          </Field>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Contacto</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Teléfono" error={errors.phone?.message}>
              <input {...register("phone")} placeholder="11 2345-6789" className={inp(false)} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input {...register("email")} type="email" placeholder="ventas@proveedor.com" className={inp(!!errors.email)} />
            </Field>
          </div>
          <Field label="Dirección" error={errors.address?.message}>
            <input {...register("address")} placeholder="Av. Corrientes 1234, CABA" className={inp(false)} />
          </Field>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Notas</h2>
          <textarea
            {...register("notes")}
            rows={3}
            placeholder="Condiciones de pago, tiempos de entrega, observaciones..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors">
            {loading ? "Guardando..." : "Guardar proveedor"}
          </button>
          <Link href="/suppliers" className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
