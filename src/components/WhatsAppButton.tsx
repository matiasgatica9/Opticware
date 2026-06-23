"use client"

import { useState, useEffect } from "react"
import { MessageCircle, X, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getTenantIdClient } from "@/lib/get-tenant-client"
import { cn } from "@/lib/utils"

// Normaliza número argentino a formato wa.me (549XXXXXXXXXX)
function normalizePhone(raw: string): string {
  let n = raw.replace(/[\s\-().+]/g, "")
  if (n.startsWith("549")) return n
  if (n.startsWith("54")) return "549" + n.slice(2)
  if (n.startsWith("0")) n = n.slice(1)
  return "549" + n
}

interface Template {
  label: string
  buildMessage: (ctx: { patientName: string; businessName: string; extra?: Record<string, string> }) => string
}

const TEMPLATES: Template[] = [
  {
    label: "Orden lista para retirar",
    buildMessage: ({ patientName, businessName, extra }) =>
      `Hola ${patientName}! 👋 Te avisamos que tu orden está lista para retirar en ${businessName}.\n\n📅 Podés pasar a partir del ${extra?.pickupDate ?? "________"}.\n\n¡Te esperamos! 😊`,
  },
  {
    label: "Recordatorio de turno",
    buildMessage: ({ patientName, businessName, extra }) =>
      `Hola ${patientName}! Te recordamos tu turno en ${businessName}${extra?.appointmentDate ? ` el ${extra.appointmentDate}` : ""}${extra?.appointmentTime ? ` a las ${extra.appointmentTime}` : ""}.\n\nCualquier consulta, respondé este mensaje. ¡Hasta pronto! 👓`,
  },
  {
    label: "Factura / comprobante",
    buildMessage: ({ patientName, businessName, extra }) =>
      `Hola ${patientName}! Te enviamos tu comprobante de ${businessName}${extra?.invoiceNumber ? ` (Nro. ${extra.invoiceNumber})` : ""}.\n\n¡Gracias por tu visita! 🙌`,
  },
  {
    label: "Mensaje libre",
    buildMessage: ({ patientName, businessName }) =>
      `Hola ${patientName}! Te escribimos desde ${businessName}.\n\n`,
  },
]

interface Props {
  phone: string | null | undefined
  patientName: string
  size?: "sm" | "md"
  extraData?: Record<string, string>
  /** If passed, skips the date picker for pickup template */
  defaultTemplateIndex?: number
}

export default function WhatsAppButton({
  phone,
  patientName,
  size = "md",
  extraData,
  defaultTemplateIndex,
}: Props) {
  const [open, setOpen] = useState(false)
  const [businessName, setBusinessName] = useState("la óptica")

  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplateIndex ?? 0)
  const [phoneInput, setPhoneInput] = useState(phone ?? "")
  const [pickupDate, setPickupDate] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    getTenantIdClient().then(async (tid) => {
      if (!tid) return
      const supabase = createClient()
      const { data } = await supabase
        .from("tenants")
        .select("business_name")
        .eq("id", tid)
        .single()
      if (data?.business_name) setBusinessName(data.business_name)
    })
  }, [])

  // Rebuild message when template / date / names change
  useEffect(() => {
    const tpl = TEMPLATES[selectedTemplate]
    const extra: Record<string, string> = { ...(extraData ?? {}) }
    if (pickupDate) extra.pickupDate = pickupDate
    setMessage(tpl.buildMessage({ patientName, businessName, extra }))
  }, [selectedTemplate, patientName, businessName, pickupDate, extraData])

  function handleOpen() {
    if (!phoneInput.trim() || !message.trim()) return
    const phone = normalizePhone(phoneInput.trim())
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, "whatsapp")
    setOpen(false)
  }

  if (!phone && size === "sm") return null

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Enviar WhatsApp"
        className={cn(
          "flex items-center gap-1.5 rounded-lg font-medium transition-colors",
          size === "sm"
            ? "p-1.5 text-[11px] bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
            : "px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700"
        )}
      >
        <MessageCircle size={size === "sm" ? 13 : 15} />
        {size === "md" && "WhatsApp"}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageCircle size={16} className="text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Enviar WhatsApp</p>
                  <p className="text-xs text-gray-500">{patientName}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Número de WhatsApp</label>
                <input
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  placeholder="Ej: 11 1234-5678"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Templates */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Plantilla</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedTemplate(i)}
                      className={cn(
                        "text-left px-3 py-2 rounded-lg text-xs border transition-colors",
                        selectedTemplate === i
                          ? "bg-green-50 border-green-300 text-green-800 font-medium"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date picker for "Orden lista" */}
              {selectedTemplate === 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de retiro</label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={e => setPickupDate(
                      e.target.value
                        ? new Date(e.target.value + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
                        : ""
                    )}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              {/* Message editor */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mensaje</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleOpen}
                disabled={!phoneInput.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <ExternalLink size={14} />
                Abrir en WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
