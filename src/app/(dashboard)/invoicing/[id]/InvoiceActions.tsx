"use client"

import { useState } from "react"
import { Printer, MessageCircle, X, Send, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  invoiceNumber: string
  invoiceType: string
  total: string
  clientName: string
  defaultPhone?: string | null
  businessName: string
  tenantId: string
}

export default function InvoiceActions({
  invoiceNumber, invoiceType, total, clientName, defaultPhone, businessName, tenantId,
}: Props) {
  const [waOpen, setWaOpen]   = useState(false)
  const [phone, setPhone]     = useState(defaultPhone ?? "")
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const message =
    `Hola ${clientName}! 👋 Te enviamos tu comprobante de ${businessName}.\n\n` +
    `📄 Factura ${invoiceType} N° ${invoiceNumber}\n` +
    `💰 Total: ${total}\n\n` +
    `¡Gracias por tu visita! 🙌`

  // ── Print: abre ventana nueva con el comprobante limpio ───────────────────
  function handlePrint() {
    const node = document.getElementById("invoice-print")
    if (!node) return

    const html = node.outerHTML
    const win = window.open("", "_blank", "width=820,height=900,scrollbars=yes")
    if (!win) return

    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Factura ${invoiceNumber}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    @media print { @page { margin: 15mm; } }
    body { font-family: system-ui, -apple-system, sans-serif; background: #fff; }
    #invoice-print { border: none !important; border-radius: 0 !important; }
  </style>
</head>
<body class="p-8">
  ${html}
  <script>
    // auto-print once Tailwind finishes loading
    window.addEventListener("load", function() {
      setTimeout(function() { window.print(); }, 800);
    });
  <\/script>
</body>
</html>`)
    win.document.close()
    win.focus()
  }

  async function handleSend() {
    if (!phone.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phone.trim(), message, tenantId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al enviar")
      } else {
        setSent(true)
        setTimeout(() => { setSent(false); setWaOpen(false) }, 2000)
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Imprimir */}
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <Printer size={14} />
        Imprimir
      </button>

      {/* WhatsApp */}
      <button
        onClick={() => { setWaOpen(true); setError(null); setSent(false) }}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
      >
        <MessageCircle size={14} />
        WhatsApp
      </button>

      {/* Modal WhatsApp */}
      {waOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageCircle size={16} className="text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Enviar comprobante por WhatsApp</p>
                  <p className="text-xs text-gray-500">{clientName}</p>
                </div>
              </div>
              <button onClick={() => setWaOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Número de WhatsApp</label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ej: 11 1234-5678"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vista previa del mensaje</label>
                <div className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 bg-gray-50 whitespace-pre-wrap leading-relaxed">
                  {message}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700">
                  <AlertCircle size={13} />
                  {error}
                </div>
              )}
            </div>

            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button
                onClick={() => setWaOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={sending || sent || !phone.trim()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50",
                  sent
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-green-600 text-white hover:bg-green-700"
                )}
              >
                {sent
                  ? <><Check size={14} /> Enviado</>
                  : sending
                    ? "Enviando..."
                    : <><Send size={14} /> Enviar</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
