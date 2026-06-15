"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle } from "lucide-react"

const schema = z.object({
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Las contraseñas no coinciden",
  path: ["confirm"],
})

type Form = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: Form) {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({ password: data.password })

    if (error) {
      setError("No se pudo actualizar la contraseña. El link puede haber expirado.")
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push("/dashboard"), 2000)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
            <CheckCircle size={32} className="text-emerald-700" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            ¡Contraseña actualizada!
          </h1>
          <p className="text-sm text-gray-500">
            Redirigiendo al dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-700 text-white text-xl font-bold mb-3">
            O
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Nueva contraseña</h1>
          <p className="text-sm text-gray-500 mt-1">Elegí una contraseña segura para tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña
            </label>
            <input
              {...register("password")}
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repetir contraseña
            </label>
            <input
              {...register("confirm")}
              type="password"
              autoComplete="new-password"
              placeholder="Repetí la contraseña"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            {errors.confirm && (
              <p className="text-xs text-red-600 mt-1">{errors.confirm.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          Creado por <span className="font-medium text-gray-500">OpticWare</span>
        </p>
      </div>
    </div>
  )
}
