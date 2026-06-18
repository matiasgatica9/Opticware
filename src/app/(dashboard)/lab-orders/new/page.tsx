"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"

const WORK_TYPES = [
  { value: "lentes",      label: "Lentes oftálmicos" },
  { value: "montaje",     label: "Montaje" },
  { value: "tratamiento", label: "Tratamiento / Antirreflejo" },
  { value: "reparacion",  label: "Reparación de armazón" },
  { value: "contacto",    label: "Lentes de contacto" },
  { value: "otro",        label: "Otro" },
]

interface Patient { id: string; first_name: string; last_name: string }

export default function NewLabOrderPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [patients, setPatients]         = useState<Patient[]>([])
  const [patientSearch, setPatientSearch] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const [form, setForm] = useState({
    work_type:        "lentes",
    work_description: "",
    lab_name:         "",
    priority:         "normal",
    estimated_days:   "",
    order_date:       new Date().toISOString().slice(0, 10),
    notes:            "",
  })

  // Buscar pacientes
  useEffect(() => {
    if (patientSearch.length < 2) { setPatients([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .or(`first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%`)
        .eq("active", true)
        .limit(8)
      setPatients(data ?? [])
      setShowDropdown(true)
    }, 250)
    return () => clearTimeout(timer)
  }, [patientSearch])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.work_description.trim()) { setError("Ingresá la descripción del trabajo"); return }
    setLoading(true)
    setError(null)

    // Calcular fecha estimada de retorno
    let estimated_return: string | null = null
    if (form.estimated_days && parseInt(form.estimated_days) > 0) {
      const d = new Date(form.order_date)
      d.setDate(d.getDate() + parseInt(form.estimated_days))
      estimated_return = d.toISOString().slice(0, 10)
    }

    const { data: { user } } = await supabase.auth.getUser()

    // Obtener tenant_id
    const { data: userData } = await supabase
      .from("users").select("tenant_id").eq("id", user!.id).single()

    const { data: order, error: err } = await supabase
      .from("lab_orders")
      .insert({
        tenant_id:        userData!.tenant_id,
        patient_id:       selectedPatient?.id ?? null,
        created_by:       user!.id,
        work_type:        form.work_type,
        work_description: form.work_description,
        lab_name:         form.lab_name || null,
        priority:         form.priority,
        estimated_days:   form.estimated_days ? parseInt(form.estimated_days) : null,
        estimated_return,
        order_date:       form.order_date,
        notes:            form.notes || null,
        status:           "en_preparacion",
      })
      .select("id")
      .single()

    if (err || !order) {
      setError("Error al crear el trabajo. Intentá de nuevo.")
      setLoading(false)
      return
    }

    router.push(`/lab-orders/${order.id}`)
  }

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/lab-orders"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Nuevo trabajo de laboratorio</h1>
          <p className="text-sm text-gray-500">Registrá y hacé seguimiento del trabajo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

        {/* Paciente */}
        <div className="p-5 space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Paciente</label>
          {selectedPatient ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-emerald-800">
                {selectedPatient.first_name} {selectedPatient.last_name}
              </span>
              <button
                type="button"
                onClick={() => { setSelectedPatient(null); setPatientSearch("") }}
                className="text-xs text-emerald-600 hover:underline"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar paciente..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none"
                />
              </div>
              {showDropdown && patients.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                  {patients.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(p)
                        setPatientSearch(`${p.first_name} ${p.last_name}`)
                        setShowDropdown(false)
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      {p.first_name} {p.last_name}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">Opcional — podés dejarlo sin paciente</p>
            </div>
          )}
        </div>

        {/* Tipo de trabajo */}
        <div className="p-5 space-y-3">
          <label className="block text-sm font-medium text-gray-700">Tipo de trabajo *</label>
          <div className="grid grid-cols-2 gap-2">
            {WORK_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => set("work_type", t.value)}
                className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                  form.work_type === t.value
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-medium"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Descripción */}
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción del trabajo *
            </label>
            <textarea
              value={form.work_description}
              onChange={e => set("work_description", e.target.value)}
              placeholder="Ej: Lentes progresivos con antirreflejo, graduación OD +2.00 -0.50 x 90°, OI +1.75..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
            <input
              type="text"
              value={form.lab_name}
              onChange={e => set("lab_name", e.target.value)}
              placeholder="Nombre del laboratorio"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Fechas y prioridad */}
        <div className="p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del pedido</label>
            <input
              type="date"
              value={form.order_date}
              onChange={e => set("order_date", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Días en laboratorio</label>
            <input
              type="number"
              min="1"
              max="90"
              value={form.estimated_days}
              onChange={e => set("estimated_days", e.target.value)}
              placeholder="7"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            {form.estimated_days && parseInt(form.estimated_days) > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Retorno estimado:{" "}
                {(() => {
                  const d = new Date(form.order_date)
                  d.setDate(d.getDate() + parseInt(form.estimated_days))
                  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
                })()}
              </p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
            <div className="flex gap-3">
              {["normal", "urgente"].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("priority", p)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
                    form.priority === p
                      ? p === "urgente"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p === "urgente" ? "🔴 Urgente" : "🟢 Normal"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones internas</label>
          <textarea
            value={form.notes}
            onChange={e => set("notes", e.target.value)}
            placeholder="Notas internas del equipo..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none"
          />
        </div>

        {/* Submit */}
        <div className="p-5">
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creando..." : "Crear trabajo"}
          </button>
        </div>
      </form>
    </div>
  )
}
