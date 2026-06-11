"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"

interface ObraSocial { id: string; name: string; code: string | null }

export default function EditPatientPage() {
  const { id } = useParams() as { id: string }
  const router  = useRouter()

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([])

  // Campos
  const [firstName, setFirstName]     = useState("")
  const [lastName, setLastName]       = useState("")
  const [dni, setDni]                 = useState("")
  const [birthDate, setBirthDate]     = useState("")
  const [phone, setPhone]             = useState("")
  const [email, setEmail]             = useState("")
  const [address, setAddress]         = useState("")
  const [obraSocialId, setObraSocialId] = useState("")
  const [obraSocialNum, setObraSocialNum] = useState("")
  const [notes, setNotes]             = useState("")
  const [active, setActive]           = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: ud } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()

      const [patRes, osRes] = await Promise.all([
        supabase.from("patients").select("*").eq("id", id).single(),
        ud ? supabase.from("obras_sociales").select("id,name,code").eq("tenant_id", ud.tenant_id).eq("active", true).order("name") : Promise.resolve({ data: [] }),
      ])

      const p = patRes.data
      if (!p) { setPageLoading(false); return }

      setFirstName(p.first_name ?? "")
      setLastName(p.last_name ?? "")
      setDni(p.dni ?? "")
      setBirthDate(p.birth_date ?? "")
      setPhone(p.phone ?? "")
      setEmail(p.email ?? "")
      setAddress(p.address ?? "")
      setObraSocialId(p.obra_social_id ?? "")
      setObraSocialNum(p.obra_social_num ?? "")
      setNotes(p.notes ?? "")
      setActive(p.active ?? true)
      setObrasSociales(osRes.data ?? [])
      setPageLoading(false)
    }
    load()
  }, [id])

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Nombre y apellido son requeridos")
      return
    }
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from("patients")
      .update({
        first_name:     firstName.trim(),
        last_name:      lastName.trim(),
        dni:            dni.trim() || null,
        birth_date:     birthDate || null,
        phone:          phone.trim() || null,
        email:          email.trim() || null,
        address:        address.trim() || null,
        obra_social_id: obraSocialId || null,
        obra_social_num: obraSocialNum.trim() || null,
        notes:          notes.trim() || null,
        active,
        updated_at:     new Date().toISOString(),
      })
      .eq("id", id)

    if (err) { setError("Error al guardar los cambios"); setSaving(false); return }

    setSaving(false)
    setSaved(true)
    setTimeout(() => router.push(`/patients/${id}`), 700)
  }

  if (pageLoading) return (
    <div className="h-40 flex items-center justify-center text-sm text-gray-400">Cargando...</div>
  )

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/patients/${id}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Editar paciente</h1>
          <p className="text-sm text-gray-400">Los cambios se guardan sobre el registro existente</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Datos personales */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Datos personales</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre *">
              <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Juan" className={inputCls} />
            </Field>
            <Field label="Apellido *">
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="García" className={inputCls} />
            </Field>
            <Field label="DNI">
              <input value={dni} onChange={e => setDni(e.target.value)} placeholder="30.123.456" className={inputCls} />
            </Field>
            <Field label="Fecha de nacimiento">
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Contacto</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Teléfono">
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="11 1234-5678" className={inputCls} />
            </Field>
            <Field label="Email">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@mail.com" className={inputCls} />
            </Field>
          </div>
          <Field label="Dirección">
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Av. Corrientes 1234" className={inputCls} />
          </Field>
        </div>

        {/* Obra social */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Obra social</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Obra social">
              <select value={obraSocialId} onChange={e => setObraSocialId(e.target.value)} className={inputCls}>
                <option value="">Sin obra social</option>
                {obrasSociales.map(os => (
                  <option key={os.id} value={os.id}>{os.name}{os.code ? ` (${os.code})` : ""}</option>
                ))}
              </select>
            </Field>
            <Field label="N° afiliado">
              <input value={obraSocialNum} onChange={e => setObraSocialNum(e.target.value)} placeholder="00-12345678/00" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Observaciones */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Observaciones</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Alergias, condiciones especiales..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={e => setActive(e.target.checked)}
              className="accent-emerald-700"
            />
            <span className="text-sm text-gray-700">Paciente activo</span>
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex items-center gap-2 bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors"
          >
            {saved ? <><Check size={14} /> Guardado</> : saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link
            href={`/patients/${id}`}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </div>
    </div>
  )
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  )
}
