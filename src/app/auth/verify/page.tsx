"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { EmailOtpType } from "@supabase/supabase-js"

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/dashboard"

  async function handleConfirm() {
    if (!token_hash || !type) {
      setStatus("error")
      setErrorMsg("Link inválido. Pedí un nuevo link de confirmación.")
      return
    }

    setStatus("loading")
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (error) {
      setStatus("error")
      setErrorMsg("El link expiró o ya fue usado. Intentá registrarte de nuevo.")
    } else {
      router.push(next)
      router.refresh()
    }
  }

  if (!token_hash || !type) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-700 text-white text-xl font-bold mb-3">
            O
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">OpticWare</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">
            Link inválido o expirado. Pedí uno nuevo.
          </div>
          <a
            href="/register"
            className="text-sm text-emerald-700 hover:underline"
          >
            Volver al registro
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-700 text-white text-xl font-bold mb-3">
          O
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">OpticWare</h1>
        <p className="text-sm text-gray-500 mt-1 mb-8">Confirmación de cuenta</p>

        {status !== "error" ? (
          <div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-4 mb-6 text-sm text-emerald-800">
              ¡Ya casi! Hacé clic en el botón para activar tu cuenta.
            </div>
            <button
              onClick={handleConfirm}
              disabled={status === "loading"}
              className="w-full bg-emerald-700 text-white py-3 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === "loading" ? "Verificando..." : "Confirmar mi cuenta"}
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">
              {errorMsg}
            </div>
            <a
              href="/register"
              className="inline-block w-full bg-emerald-700 text-white py-3 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
            >
              Registrarme de nuevo
            </a>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Creado por <span className="font-medium text-gray-500">OpticWare</span>
        </p>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  )
}
