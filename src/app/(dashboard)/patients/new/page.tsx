"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const schema = z.object({
  first_name:  z.string().min(1, "El nombre es requerido"),
  last_name:   z.string().optional(),
  dni:         z.string().optional(),
  phone:       z.string().optional(),
  email:       z.string().email("Email inválido").optional().or(z.literal("")),
  birth_date:  z.string().optional(),
  address:     z.string().optional(),
  notes:       z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewPatientPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Error al guardar el paciente")
        setLoading(false)
        return
      }
      router.push(`/patients/${json.id}`)
    } catch {
      setError("Error de conexión")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/patients"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Nuevo paciente</h1>
          <p className="text-sm text-gray-500">Completá los datos del paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Datos personales */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Datos personales</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre *" error={errors.first_name?.message} hint="Requerido">
              <input
                {...register("first_name")}
                placeholder="Juan"
                className={inputClass(!!errors.first_name)}
              />
            </Field>
            <Field label="Apellido">
              <input
                {...register("last_name")}
                placeholder="García"
                className={inputClass(false)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="DNI">
              <input
                {...register("dni")}
                placeholder="30.123.456"
                className={inputClass(false)}
              />
            </Field>
            <Field label="Fecha de nacimiento">
              <input
                {...register("birth_date")}
                type="date"
                className={inputClass(false)}
              />
            </Field>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Contacto</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Teléfono">
              <input
                {...register("phone")}
                placeholder="11 1234-5678"
                className={inputClass(false)}
              />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input
                {...register("email")}
                type="email"
                placeholder="juan@mail.com"
                className={inputClass(!!errors.email)}
              />
            </Field>
          </div>

          <Field label="Dirección">
            <input
              {...register("address")}
              placeholder="Av. Corrientes 1234, CABA"
              className={inputClass(false)}
            />
          </Field>
        </div>

        {/* Observaciones */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Observaciones</h2>
          <textarea
            {...register("notes")}
            placeholder="Alergias, condiciones especiales, notas relevantes..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Guardando..." : "Guardar paciente"}
          </button>
          <Link
            href="/patients"
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return `w-full px-3 py-2 border rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
    hasError
      ? "border-red-300 focus:ring-red-500"
      : "border-gray-200 focus:ring-emerald-600"
  }`
}
