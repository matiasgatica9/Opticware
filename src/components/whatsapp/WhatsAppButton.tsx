"use client"

import { useState } from "react"
import { MessageCircle, Check, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  to: string          // número del paciente
  message: string     // mensaje pre-armado
  tenantId: string
  label?: string
  size?: "sm" | "md"
  variant?: "outline" | "solid"
}

type State = "idle" | "sending" | "sent" | "error"

export default function WhatsAppButton({
  to, message, tenantId, label = "Enviar WhatsApp", size = "md", variant = "outline",
}: Props) {
  const [state, setState] = useState<State>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function send() {
    if (state === "sending" || state === "sent") return
    setState("sending")
    setErrorMsg(null)

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, message, tenantId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? "Error al enviar")
        setState("error")
        setTimeout(() => setState("idle"), 4000)
        return
      }
      setState("sent")
      setTimeout(() => setState("idle"), 3000)
    } catch {
      setErrorMsg("Error de red")
      setState("error")
      setTimeout(() => setState("idle"), 4000)
    }
  }

  const base = cn(
    "flex items-center gap-1.5 rounded-lg font-medium transition-all",
    size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
  )

  const styles: Record<State, string> = {
    idle:    variant === "solid"
               ? "bg-[#25D366] text-white hover:bg-[#1ebe5d]"
               : "border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10",
    sending: "border border-gray-200 text-gray-400 cursor-not-allowed",
    sent:    "border border-emerald-200 bg-emerald-50 text-emerald-700",
    error:   "border border-red-200 bg-red-50 text-red-600",
  }

  const Icon = state === "sending" ? Loader2
             : state === "sent"    ? Check
             : state === "error"   ? AlertCircle
             : MessageCircle

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={send}
        disabled={state === "sending" || state === "sent"}
        className={cn(base, styles[state])}
      >
        <Icon
          size={size === "sm" ? 12 : 14}
          className={state === "sending" ? "animate-spin" : ""}
        />
        {state === "sent"    ? "¡Enviado!"
       : state === "error"   ? "Reeintentar"
       : state === "sending" ? "Enviando..."
       : label}
      </button>
      {state === "error" && errorMsg && (
        <p className="text-[10px] text-red-600 max-w-[200px]">{errorMsg}</p>
      )}
    </div>
  )
}
