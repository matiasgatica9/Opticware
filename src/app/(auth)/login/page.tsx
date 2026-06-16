"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Suspense } from "react"

// Detecta si el valor es un teléfono (solo dígitos, espacios, guiones, +, paréntesis)
function isPhone(value: string) {
  return /^[\d\s\-\+\(\)]{7,}$/.test(value.trim())
}

const loginSchema = z.object({
  identifier: z.string().min(1, "Ingresá tu email o teléfono"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "link_invalido"
      ? "El link expiró o es inválido. Pedí uno nuevo."
      : null
  )
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    let email = data.identifier.trim()

    // Si parece teléfono, buscar el email asociado
    if (isPhone(email)) {
      const { data: foundEmail, error: rpcErr } = await supabase
        .rpc("get_email_by_phone", { p_phone: email })

      if (rpcErr || !foundEmail) {
        setError("No encontramos una cuenta con ese número de teléfono.")
        setLoading(false)
        return
      }
      email = foundEmail as string
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: data.password,
    })

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setError("Confirmá tu email antes de ingresar. Revisá tu bandeja de entrada.")
      } else {
        setError("Credenciales incorrectas.")
      }
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-700 text-white text-xl font-bold mb-3">
            O
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">OpticWare</h1>
          <p className="text-sm text-gray-500 mt-1">Ingresá a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email o teléfono
            </label>
            <input
              {...register("identifier")}
              type="text"
              autoComplete="username"
              placeholder="nombre@optica.com o 351 123 4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            {errors.identifier && (
              <p className="text-xs text-red-600 mt-1">{errors.identifier.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <a
                href="/forgot-password"
                className="text-xs text-emerald-700 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <input
              {...register("password")}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
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
            className="w-full bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tenés cuenta?{" "}
          <a href="/register" className="text-emerald-700 font-medium hover:underline">
            Registrá tu óptica
          </a>
        </p>

        <p className="text-center text-xs text-gray-400 mt-8">
          Creado por <span className="font-medium text-gray-500">OpticWare</span>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
