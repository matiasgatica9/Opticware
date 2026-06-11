"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, User, Calendar, Clock, FileText } from "lucide-react"
import { formatDate } from "@/lib/utils"
import WhatsAppButton from "@/components/whatsapp/WhatsAppButton"

const STATUS_STYLES: Record<string, string> = {
  pendiente:  "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmado: "bg-blue-50 text-blue-700 border-blue-200",
  presente:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  ausente:    "bg-red-50 text-red-600 border-red-200",
  cancelado:  "bg-gray-50 text-gray-400 border-gray-200",
}

const STATUS_LABELS: Record<string, string> = {
  pendiente:  "Pendiente",
  confirmado: "Confirmado",
  presente:   "Presente",
  ausente:    "Ausente",
  cancelado:  "Cancelado",
}

const TYPE_LABELS: Record<string, string> = {
  examen_visual: "Examen visual",
  control:       "Control",
  entrega:       "Entrega",
  eleccion:      "Elección",
  otro:          "Otro",
}

export default function AppointmentDetailPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }

  const [apt, setApt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState("")

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: ud } = await supabase.from("users").select("tenant_id, tenants(business_name)").eq("id", user.id).single()
        if (ud) {
          setTenantId(ud.tenant_id)
          setBusinessName((ud.tenants as any)?.business_name ?? "")
        }
      }
      const { data } = await supabase
        .from("appointments")
        .select("*, patients(id, first_name, last_name, phone)")
        .eq("id", id)
        .single()
      setApt(data)
      setLoading(false)
    }
    load()
  }, [id])

  async function updateStatus(status: string) {
    setUpdating(true)
    const supabase = createClient()
    await supabase.from("appointments").update({ status }).eq("id", id)
    setApt((prev: any) => ({ ...prev, status }))
    setUpdating(false)
  }

  async function deleteAppointment() {
    if (!confirm("¿Cancelar este turno?")) return
    const supabase = createClient()
    await supabase.from("appointments").update({ status: "cancelado" }).eq("id", id)
    router.push("/agenda")
  }

  if (loading) return <div className="h-40 flex items-center justify-center text-sm text-gray-400">Cargando...</div>
  if (!apt) return <div className="text-sm text-gray-500">Turno no encontrado.</div>

  const scheduledDate = new Date(apt.scheduled_at)
  const timeStr = scheduledDate.toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  })
  const dateStr = scheduledDate.toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  })

  const NEXT_STATUS: Record<string, { label: string; value: string; color: string }[]> = {
    pendiente:  [
      { label: "Confirmar", value: "confirmado", color: "bg-blue-600 text-white hover:bg-blue-700" },
      { label: "Cancelar turno", value: "cancelado", color: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" },
    ],
    confirmado: [
      { label: "Paciente presente", value: "presente", color: "bg-emerald-700 text-white hover:bg-emerald-800" },
      { label: "Paciente ausente",  value: "ausente",  color: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" },
    ],
    presente:   [],
    ausente:    [
      { label: "Remarcar como pendiente", value: "pendiente", color: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
    ],
    cancelado:  [
      { label: "Reactivar como pendiente", value: "pendiente", color: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
    ],
  }

  const actions = NEXT_STATUS[apt.status] ?? []

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/agenda" className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={15} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">Turno</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[apt.status]}`}>
              {STATUS_LABELS[apt.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 capitalize">{dateStr}</p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
            <Calendar size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{TYPE_LABELS[apt.type] ?? apt.type}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span className="flex items-center gap-1"><Clock size={11} />{timeStr}</span>
              <span>{apt.duration_minutes} min</span>
            </div>
          </div>
        </div>

        {apt.patients && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <User size={16} />
            </div>
            <div className="flex-1">
              <Link href={`/patients/${apt.patients.id}`} className="text-sm font-medium text-gray-900 hover:text-emerald-700 transition-colors">
                {apt.patients.last_name}, {apt.patients.first_name}
              </Link>
              {apt.patients.phone && (
                <p className="text-xs text-gray-500 mt-0.5">{apt.patients.phone}</p>
              )}
            </div>
            <Link href={`/patients/${apt.patients.id}`} className="text-xs text-emerald-700 hover:underline">Ver ficha</Link>
          </div>
        )}

        {apt.notes && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
              <FileText size={16} />
            </div>
            <p className="text-sm text-gray-600 pt-1.5">{apt.notes}</p>
          </div>
        )}
      </div>

      {/* Status actions */}
      {actions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Actualizar estado</h2>
          <div className="flex flex-wrap gap-2">
            {actions.map(({ label, value, color }) => (
              <button
                key={value}
                onClick={() => updateStatus(value)}
                disabled={updating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${color}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp — confirmar turno */}
      {apt.patients?.phone && tenantId && apt.status !== "cancelado" && apt.status !== "ausente" && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Notificar al paciente</h2>
          <WhatsAppButton
            to={apt.patients.phone}
            message={`Hola ${apt.patients.first_name}! Te confirmamos tu turno para el ${dateStr} a las ${timeStr} en ${businessName || "la óptica"}. ¡Te esperamos!`}
            tenantId={tenantId}
            label="Confirmar por WhatsApp"
            size="sm"
            variant="outline"
          />
          <p className="text-[10px] text-gray-400">
            Se enviará un mensaje a {apt.patients.phone}
          </p>
        </div>
      )}
    </div>
  )
}
