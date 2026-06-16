"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Mail } from "lucide-react"

const registerSchema = z.object({
  businessName: z.string().min(2, "Ingresá el nombre de tu óptica"),
  fullName: z.string().min(2, "Ingresá tu nombre completo"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterForm) {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
        data: {
          full_name: data.fullName,
          business_name: data.businessName,
        },
      },
    })

    if (authError) {
      if (authError.message.includes("already registered")) {
        setError("Ese email ya tiene una cuenta. ¿Querés ingresar?")
      } else if (authError.message.includes("rate limit")) {
        setError("Se enviaron demasiados emails. Esperá unos minutos e intentá de nuevo.")
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }

    if (authData.user) {
      setEmailSent(data.email)
    }
    setLoading(false)
  }

  async function handleResend() {
    if (!emailSent) return
    setResending(true)
    setResendMsg(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: emailSent,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
      },
    })
    setResendMsg(error ? "No se pudo reenviar. Intentá de nuevo." : "¡Reenviado! Revisá tu bandeja.")
    setResending(false)
  }

  // Estado post-registro: pantalla de "revisá tu email"
  if (emailSent) {
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
            Te enviamos un link de confirmación a
          </p>
          <p className="text-sm font-medium text-gray-800 mb-6">{emailSent}</p>
          <p className="text-sm text-gray-500 mb-8">
            Hacé clic en el link del email para activar tu cuenta y empezar a
            usar OpticWare.
          </p>
          <p className="text-xs text-gray-400 mb-4">
            ¿No llegó? Revisá la carpeta de spam.
          </p>
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-emerald-700 font-medium hover:underline disabled:opacity-50"
          >
            {resending ? "Reenviando..." : "Volver a enviar el email"}
          </button>
          {resendMsg && (
            <p className="text-xs mt-2 text-gray-500">{resendMsg}</p>
          )}
          <p className="text-center text-xs text-gray-400 mt-10">
            Creado por{" "}
            <span className="font-medium text-gray-500">OpticWare</span>
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
          <h1 className="text-2xl font-semibold text-gray-900">OpticWare</h1>
          <p className="text-sm text-gray-500 mt-1">Registrá tu óptica — gratis 30 días</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la óptica
            </label>
            <input
              {...register("businessName")}
              placeholder="Óptica San Martín"
              autoComplete="off"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            {errors.businessName && (
              <p className="text-xs text-red-600 mt-1">{errors.businessName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tu nombre
            </label>
            <input
              {...register("fullName")}
              placeholder="Juan García"
              autoComplete="off"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="nombre@optica.com"
              autoComplete="off"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {error}
              {error.includes("ingresar") && (
                <a href="/login" className="ml-1 underline font-medium">Ingresar</a>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tenés cuenta?{" "}
          <a href="/login" className="text-emerald-700 font-medium hover:underline">
            Ingresar
          </a>
        </p>

        <p className="text-center text-xs text-gray-400 mt-8">
          Creado por <span className="font-medium text-gray-500">OpticWare</span>
        </p>
      </div>
    </div>
  )
}
