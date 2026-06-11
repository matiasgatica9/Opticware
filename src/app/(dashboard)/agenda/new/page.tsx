"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, Search, X } from "lucide-react"

const schema = z.object({
  date:             z.string().min(1, "Requerido"),
  time:             z.string().min(1, "Requerido"),
  duration_minutes: z.coerce.number().default(30),
  type:             z.enum(["examen_visual","control","entrega","eleccion","otro"]),
  notes:            z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Patient { id: string; first_name: string; last_name: string; dni: string | null }

export default function NewAppointmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get("date") ?? new Date().toISOString().slice(0, 10)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientQuery, setPatientQuery] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: dateParam, time: "09:00", duration_minutes: 30, type: "examen_visual" },
  })

  // Cargar pacientes
  useEffect(() => {
    const fetchPatients = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userData } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
      if (!userData) return
      const { data } = await supabase
        .from("patients")
        .select("id, first_name, last_name, dni")
        .eq("tenant_id", userData.tenant_id)
        .eq("active", true)
        .order("last_name")
      setPatients(data ?? [])
    }
    fetchPatients()
  }, [])

  const filteredPatients = patients.filter(p => {
    const q = patientQuery.toLowerCase()
    return (
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      p.dni?.includes(q)
    )
  }).slice(0, 8)

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { data: userData } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
    if (!userData) { setError("Error de sesión"); setLoading(false); return }

    // Construir el timestamp en Argentina (UTC-3)
    const scheduledAt = new Date(`${data.date}T${data.time}:00-03:00`).toISOString()

    const { error: insertError } = await supabase.from("appointments").insert({
      tenant_id:        userData.tenant_id,
      patient_id:       selectedPatient?.id ?? null,
      scheduled_at:     scheduledAt,
      duration_minutes: data.duration_minutes,
      type:             data.type,
      status:           "pendiente",
      notes:            data.notes || null,
      created_by:       user.id,
    })

    if (insertError) {
      setError("Error al guardar el turno")
      setLoading(false)
      return
    }

    router.push("/agenda")
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/agenda" className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Nuevo turno</h1>
          <p className="text-sm text-gray-500">Agendá una cita</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Paciente */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Paciente</h2>

          {selectedPatient ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  {selectedPatient.last_name}, {selectedPatient.first_name}
                </p>
                {selectedPatient.dni && (
                  <p className="text-xs text-emerald-600">DNI {selectedPatient.dni}</p>
                )}
              </div>
              <button type="button" onClick={() => { setSelectedPatient(null); setPatientQuery("") }} className="text-emerald-400 hover:text-emerald-600">
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                <Search size={13} className="text-gray-400" />
                <input
                  type="text"
                  value={patientQuery}
                  onChange={e => { setPatientQuery(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Buscar paciente por nombre o DNI..."
                  className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                />
              </div>
              {showDropdown && patientQuery && filteredPatients.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                  {filteredPatients.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedPatient(p); setShowDropdown(false); setPatientQuery("") }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left transition-colors"
                    >
                      <span className="text-sm text-gray-800">{p.last_name}, {p.first_name}</span>
                      {p.dni && <span className="text-xs text-gray-400">{p.dni}</span>}
                    </button>
                  ))}
                </div>
              )}
              {showDropdown && patientQuery && filteredPatients.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 px-3 py-2">
                  <p className="text-xs text-gray-400">No se encontraron pacientes</p>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400">El paciente es opcional — podés agendarlo sin vincular a uno.</p>
        </div>

        {/* Fecha y hora */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Fecha y hora</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha *" error={errors.date?.message}>
              <input {...register("date")} type="date" className={inp(!!errors.date)} />
            </Field>
            <Field label="Hora *" error={errors.time?.message}>
              <input {...register("time")} type="time" className={inp(!!errors.time)} />
            </Field>
          </div>
          <Field label="Duración">
            <select {...register("duration_minutes")} className={inp(false)}>
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1 hora 30 min</option>
            </select>
          </Field>
        </div>

        {/* Tipo */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Tipo de cita</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "examen_visual", label: "Examen visual" },
              { value: "control",       label: "Control" },
              { value: "entrega",       label: "Entrega" },
              { value: "eleccion",      label: "Elección de armazón" },
              { value: "otro",          label: "Otro" },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input {...register("type")} type="radio" value={value} className="accent-emerald-700" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
            <textarea
              {...register("notes")}
              rows={2}
              placeholder="Motivo de la consulta, preparación especial..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors">
            {loading ? "Guardando..." : "Guardar turno"}
          </button>
          <Link href="/agenda" className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function inp(hasError: boolean) {
  return `w-full px-3 py-2 border rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${hasError ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-emerald-600"}`
}
