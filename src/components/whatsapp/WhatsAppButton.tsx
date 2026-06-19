"use client"

import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Normaliza número argentino a formato wa.me (549XXXXXXXXXX)
function normalizePhone(raw: string): string {
  let n = raw.replace(/[\s\-().+]/g, "")
  if (n.startsWith("549")) return n
  if (n.startsWith("54")) return "549" + n.slice(2)
  if (n.startsWith("0")) n = n.slice(1)
  return "549" + n
}

interface Props {
  to: string
  message: string
  label?: string
  size?: "sm" | "md"
  variant?: "outline" | "solid"
}

export default function WhatsAppButton({
  to, message, label = "Enviar WhatsApp", size = "md", variant = "outline",
}: Props) {
  function handleClick() {
    const phone = normalizePhone(to)
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const base = cn(
    "flex items-center gap-1.5 rounded-lg font-medium transition-all",
    size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
    variant === "solid"
      ? "bg-[#25D366] text-white hover:bg-[#1ebe5d]"
      : "border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10",
  )

  return (
    <button onClick={handleClick} className={base}>
      <MessageCircle size={size === "sm" ? 12 : 14} />
      {label}
    </button>
  )
}
