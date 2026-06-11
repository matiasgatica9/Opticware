"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Mail, ArrowLeft } from "lucide-react"

const schema = z.object({
  email: z.string().email("Email inválido"),
})

type Form = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: Form) {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery&next=/reset-password`,
    })

    if (error) {
      setError("Ocurrió un error. Intentá de nuevo.")
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
            <Mail size={32} className="text-emerald-700" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Revisá tu email
          </h1>
          <p className="text-sm text-gray-500 mb-1">
            Te enviamos un link para restablecer tu contraseña a
          </p>
          <p className="text-sm font-medium text-gray-800 mb-6">{getValues("email")}</p>
          <p className="text-xs text-gray-400 mb-8">
            El link expira en 1 hora. Si no llegó, revisá spam.
          </p>
          <a
            href="/login"
            className="text-sm text-emerald-700 font-medium hover:underline flex items-center justify-center gap-1"
          >
            <ArrowLeft size={14} /> Volver al login
          </a>
          <p className="text-center text-xs text-gray-400 mt-10">
            Desarrollado por <span className="font-medium text-gray-500">VisualGest</span>
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
          <h1 className="text-2xl font-semibold text-gray-900">Recuperar contraseña</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ingresá tu email y te enviamos un link para crear una nueva contraseña.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="nombre@optica.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
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
            {loading ? "Enviando..." : "Enviar link"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <a href="/login" className="text-emerald-700 font-medium hover:underline flex items-center justify-center gap-1">
            <ArrowLeft size={14} /> Volver al login
          </a>
        </p>

        <p className="text-center text-xs text-gray-400 mt-8">
          Desarrollado por <span className="font-medium text-gray-500">VisualGest</span>
        </p>
      </div>
    </div>
  )
}
