"use client"

import { useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, Plus, X, ChevronDown, Upload, ImageIcon } from "lucide-react"

// ─── Tipos de sección extra ───────────────────────────────────────────────────
type GradSection = {
  id: string; type: "graduation"; title: string
  od_sphere: string; od_cylinder: string; od_axis: string; od_addition: string; od_pd: string
  oi_sphere: string; oi_cylinder: string; oi_axis: string; oi_addition: string; oi_pd: string
}
type TreatSection = { id: string; type: "treatments"; title: string; selected: string[] }
type NotesSection = { id: string; type: "notes"; title: string; text: string }
type ExtraSection = GradSection | TreatSection | NotesSection

const TREATMENTS = [
  { value: "antirreflejo",  label: "Antirreflejo" },
  { value: "fotocromático", label: "Fotocromático" },
  { value: "uv",            label: "UV" },
  { value: "blue_light",    label: "Blue light" },
  { value: "endurecido",    label: "Endurecido" },
]

const schema = z.object({
  issued_date:   z.string().min(1, "Requerido"),
  issued_by:     z.string().optional(),
  od_sphere:     z.string().optional(),
  od_cylinder:   z.string().optional(),
  od_axis:       z.string().optional(),
  od_addition:   z.string().optional(),
  od_pd:         z.string().optional(),
  oi_sphere:     z.string().optional(),
  oi_cylinder:   z.string().optional(),
  oi_axis:       z.string().optional(),
  oi_addition:   z.string().optional(),
  oi_pd:         z.string().optional(),
  lens_type:     z.string().optional(),
  lens_material: z.string().optional(),
  treatments:    z.array(z.string()).optional(),
  notes:         z.string().optional(),
})

type FormData = z.infer<typeof schema>

const toNum = (s?: string) => { if (!s || !s.trim()) return null; const n = parseFloat(s.replace(",",".")); return isNaN(n) ? null : n }
const toInt = (s?: string) => { if (!s || !s.trim()) return null; const n = parseInt(s); return isNaN(n) ? null : n }
const uid   = () => Math.random().toString(36).slice(2)

// ─── Componentes helper ────────────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
function inp(err = false) {
  return `w-full px-3 py-2 border rounded-lg text-sm text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${err ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-emerald-600"}`
}

// ─── Tabla OD/OI reutilizable ──────────────────────────────────────────────────
function GradTable({
  prefix, values, onChange,
}: {
  prefix: string
  values: Record<string, string>
  onChange: (field: string, val: string) => void
}) {
  const cols = [
    { key: "sphere",   label: "Esfera",   ph: "-2.00" },
    { key: "cylinder", label: "Cilindro", ph: "-0.75" },
    { key: "axis",     label: "Eje",      ph: "165"   },
    { key: "addition", label: "Adición",  ph: "+2.00" },
    { key: "pd",       label: "DIP",      ph: "32"    },
  ]
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="w-14 pb-2" />
            {cols.map(c => (
              <th key={c.key} className="pb-2 text-xs font-medium text-gray-500 text-center px-1">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {["od","oi"].map(eye => (
            <tr key={eye}>
              <td className="pr-3 py-2">
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">{eye.toUpperCase()}</span>
              </td>
              {cols.map(c => (
                <td key={c.key} className="px-1 py-2">
                  <input
                    value={values[`${eye}_${c.key}`] ?? ""}
                    onChange={e => onChange(`${eye}_${c.key}`, e.target.value)}
                    placeholder={c.ph}
                    className="w-full text-center px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Sección extra individual ──────────────────────────────────────────────────
function ExtraSectionCard({
  section, onUpdate, onRemove,
}: {
  section: ExtraSection
  onUpdate: (s: ExtraSection) => void
  onRemove: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-emerald-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={section.title}
          onChange={e => onUpdate({ ...section, title: e.target.value })}
          placeholder="Título de la sección"
          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
        />
        <button type="button" onClick={onRemove} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
          <X size={15} />
        </button>
      </div>

      {section.type === "graduation" && (
        <GradTable
          prefix={section.id}
          values={{
            od_sphere: section.od_sphere, od_cylinder: section.od_cylinder, od_axis: section.od_axis,
            od_addition: section.od_addition, od_pd: section.od_pd,
            oi_sphere: section.oi_sphere, oi_cylinder: section.oi_cylinder, oi_axis: section.oi_axis,
            oi_addition: section.oi_addition, oi_pd: section.oi_pd,
          }}
          onChange={(field, val) => onUpdate({ ...section, [field]: val } as GradSection)}
        />
      )}

      {section.type === "treatments" && (
        <div className="flex flex-wrap gap-2">
          {TREATMENTS.map(({ value, label }) => {
            const active = section.selected.includes(value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => onUpdate({
                  ...section,
                  selected: active
                    ? section.selected.filter(t => t !== value)
                    : [...section.selected, value],
                })}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${active ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
              >
                {label}
              </button>
            )
          })}
          {/* tratamiento personalizado */}
          <input
            placeholder="+ Tratamiento personalizado"
            className="px-3 py-1.5 border border-dashed border-gray-300 rounded-full text-sm text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent w-52"
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault()
                const val = (e.target as HTMLInputElement).value.trim()
                if (val && !section.selected.includes(val)) {
                  onUpdate({ ...section, selected: [...section.selected, val] });
                  (e.target as HTMLInputElement).value = ""
                }
              }
            }}
          />
        </div>
      )}

      {section.type === "notes" && (
        <textarea
          value={section.text}
          onChange={e => onUpdate({ ...section, text: e.target.value })}
          rows={3}
          placeholder="Escribí las notas de esta sección..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none"
        />
      )}
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function NewPrescriptionPage() {
  const router    = useRouter()
  const params    = useParams()
  const patientId = params.id as string

  const [error, setError]               = useState<string | null>(null)
  const [loading, setLoading]           = useState(false)
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([])
  const [customTreatments, setCustomTreatments]     = useState<string[]>([])
  const [showTreatInput, setShowTreatInput]         = useState(false)
  const [extraSections, setExtraSections] = useState<ExtraSection[]>([])
  const [showMenu, setShowMenu]         = useState(false)
  // Lens type con opción personalizada
  const [lensTypeSelect, setLensTypeSelect]     = useState("")
  const [lensTypeCustom, setLensTypeCustom]     = useState("")
  // Lens material con opción personalizada
  const [lensMaterialSelect, setLensMaterialSelect] = useState("")
  const [lensMaterialCustom, setLensMaterialCustom] = useState("")
  const [imageUrl, setImageUrl]         = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { issued_date: new Date().toISOString().split("T")[0] },
  })

  async function uploadImage(file: File) {
    setUploadingImage(true)
    const supabase = createClient()
    const ext  = file.name.split(".").pop()
    const path = `${patientId}/${uid()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from("prescription-images")
      .upload(path, file, { upsert: false })
    if (upErr) { setError("Error al subir la imagen"); setUploadingImage(false); return }
    const { data: { publicUrl } } = supabase.storage.from("prescription-images").getPublicUrl(path)
    setImageUrl(publicUrl)
    setImagePreview(URL.createObjectURL(file))
    setUploadingImage(false)
  }

  function addSection(type: ExtraSection["type"]) {
    setShowMenu(false)
    const id = uid()
    if (type === "graduation") {
      setExtraSections(prev => [...prev, {
        id, type, title: "Graduación adicional",
        od_sphere:"", od_cylinder:"", od_axis:"", od_addition:"", od_pd:"",
        oi_sphere:"", oi_cylinder:"", oi_axis:"", oi_addition:"", oi_pd:"",
      }])
    } else if (type === "treatments") {
      setExtraSections(prev => [...prev, { id, type, title: "Tratamientos", selected: [] }])
    } else {
      setExtraSections(prev => [...prev, { id, type, title: "Notas", text: "" }])
    }
  }

  function updateSection(updated: ExtraSection) {
    setExtraSections(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  function removeSection(id: string) {
    setExtraSections(prev => prev.filter(s => s.id !== id))
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }
    const { data: userData } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
    if (!userData) { setError("Error al obtener datos del usuario"); setLoading(false); return }

    const { error: insertError } = await supabase.from("prescriptions").insert({
      tenant_id:      userData.tenant_id,
      patient_id:     patientId,
      issued_date:    data.issued_date,
      issued_by:      data.issued_by || null,
      od_sphere:      toNum(data.od_sphere),
      od_cylinder:    toNum(data.od_cylinder),
      od_axis:        toInt(data.od_axis),
      od_addition:    toNum(data.od_addition),
      od_pd:          toNum(data.od_pd),
      oi_sphere:      toNum(data.oi_sphere),
      oi_cylinder:    toNum(data.oi_cylinder),
      oi_axis:        toInt(data.oi_axis),
      oi_addition:    toNum(data.oi_addition),
      oi_pd:          toNum(data.oi_pd),
      lens_type:      (lensTypeSelect === "__custom__" ? lensTypeCustom : lensTypeSelect) || null,
      lens_material:  (lensMaterialSelect === "__custom__" ? lensMaterialCustom : lensMaterialSelect) || null,
      treatments:     [...selectedTreatments, ...customTreatments],
      notes:          data.notes || null,
      extra_sections: extraSections,
      image_url:      imageUrl || null,
    })

    if (insertError) { setError("Error al guardar la receta"); setLoading(false); return }
    router.push(`/patients/${patientId}`)
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/patients/${patientId}`} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Nueva receta</h1>
          <p className="text-sm text-gray-500">Historia clínica del paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Encabezado */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Datos de la receta</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha *" error={errors.issued_date?.message}>
              <input {...register("issued_date")} type="date" className={inp(!!errors.issued_date)} />
            </Field>
            <Field label="Médico / Oftalmólogo">
              <input {...register("issued_by")} placeholder="Dr. García" className={inp(false)} />
            </Field>
          </div>
        </div>

        {/* Graduación principal */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Graduación</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="w-14 pb-2" />
                  {["Esfera","Cilindro","Eje","Adición","DIP"].map(h => (
                    <th key={h} className="pb-2 text-xs font-medium text-gray-500 text-center px-1">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {["od","oi"].map(eye => (
                  <tr key={eye}>
                    <td className="pr-3 py-2">
                      <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">{eye.toUpperCase()}</span>
                    </td>
                    {[
                      { name: `${eye}_sphere`   as keyof FormData, ph: eye==="od" ? "-2.00" : "-1.50" },
                      { name: `${eye}_cylinder` as keyof FormData, ph: eye==="od" ? "-0.75" : "-0.50" },
                      { name: `${eye}_axis`     as keyof FormData, ph: eye==="od" ? "165"   : "170"   },
                      { name: `${eye}_addition` as keyof FormData, ph: "+2.00" },
                      { name: `${eye}_pd`       as keyof FormData, ph: eye==="od" ? "32"    : "31"    },
                    ].map(({ name, ph }) => (
                      <td key={name} className="px-1 py-2">
                        <input {...register(name)} placeholder={ph}
                          className="w-full text-center px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cristal */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Cristal</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Tipo de cristal */}
            <Field label="Tipo de cristal">
              <select
                value={lensTypeSelect}
                onChange={e => { setLensTypeSelect(e.target.value); setLensTypeCustom("") }}
                className={inp(false)}
              >
                <option value="">— Seleccionar —</option>
                <option value="monofocal">Monofocal</option>
                <option value="bifocal">Bifocal</option>
                <option value="progresivo">Progresivo</option>
                <option value="ocupacional">Ocupacional</option>
                <option value="__custom__">+ Agregar tipo...</option>
              </select>
              {lensTypeSelect === "__custom__" && (
                <input
                  value={lensTypeCustom}
                  onChange={e => setLensTypeCustom(e.target.value)}
                  placeholder="Ej: Bifocal ejecutivo"
                  className="mt-1.5 w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  autoFocus
                />
              )}
            </Field>

            {/* Material */}
            <Field label="Material">
              <select
                value={lensMaterialSelect}
                onChange={e => { setLensMaterialSelect(e.target.value); setLensMaterialCustom("") }}
                className={inp(false)}
              >
                <option value="">— Seleccionar —</option>
                <option value="cr39">CR-39</option>
                <option value="policarbonato">Policarbonato</option>
                <option value="trivex">Trivex</option>
                <option value="alto_indice_167">Alto índice 1.67</option>
                <option value="alto_indice_174">Alto índice 1.74</option>
                <option value="cristal_mineral">Cristal mineral</option>
                <option value="__custom__">+ Agregar material...</option>
              </select>
              {lensMaterialSelect === "__custom__" && (
                <input
                  value={lensMaterialCustom}
                  onChange={e => setLensMaterialCustom(e.target.value)}
                  placeholder="Ej: Orgánico 1.56"
                  className="mt-1.5 w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                  autoFocus
                />
              )}
            </Field>
          </div>

          {/* Tratamientos */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Tratamientos</label>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Chips fijos */}
              {TREATMENTS.map(({ value, label }) => {
                const active = selectedTreatments.includes(value)
                return (
                  <button key={value} type="button"
                    onClick={() => setSelectedTreatments(prev => active ? prev.filter(t => t !== value) : [...prev, value])}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${active ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                  >{label}</button>
                )
              })}

              {/* Chips personalizados (con X para borrar) */}
              {customTreatments.map(t => (
                <span key={t} className="flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full text-sm bg-emerald-700 text-white border border-emerald-700">
                  {t}
                  <button type="button" onClick={() => setCustomTreatments(prev => prev.filter(x => x !== t))}
                    className="hover:bg-emerald-800 rounded-full p-0.5 transition-colors">
                    <X size={11} />
                  </button>
                </span>
              ))}

              {/* Botón + / input inline */}
              {showTreatInput ? (
                <input
                  autoFocus
                  placeholder="Escribí y presioná Enter"
                  className="px-3 py-1.5 border border-emerald-300 rounded-full text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent w-48"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const val = (e.target as HTMLInputElement).value.trim()
                      if (val && !customTreatments.includes(val) && !TREATMENTS.find(t => t.label === val)) {
                        setCustomTreatments(prev => [...prev, val]);
                        (e.target as HTMLInputElement).value = ""
                      }
                      setShowTreatInput(false)
                    }
                    if (e.key === "Escape") setShowTreatInput(false)
                  }}
                  onBlur={() => setShowTreatInput(false)}
                />
              ) : (
                <button type="button" onClick={() => setShowTreatInput(true)}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                  title="Agregar tratamiento"
                >
                  <Plus size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Foto de la receta */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Foto de la receta</h2>
          <p className="text-xs text-gray-400 mb-3">Opcional — subí una foto o escaneo de la receta física del paciente.</p>

          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Receta" className="max-h-48 rounded-lg border border-gray-200 object-contain" />
              <button
                type="button"
                onClick={() => { setImagePreview(null); setImageUrl(null) }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => imageRef.current?.click()}
              disabled={uploadingImage}
              className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-700 transition-colors disabled:opacity-50"
            >
              {uploadingImage ? (
                <span className="text-sm text-gray-500">Subiendo...</span>
              ) : (
                <>
                  <Upload size={15} />
                  Subir foto de receta
                  <span className="text-xs text-gray-400">(JPG, PNG, PDF)</span>
                </>
              )}
            </button>
          )}

          <input
            ref={imageRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f) }}
          />
        </div>

        {/* Observaciones */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Observaciones</h2>
          <textarea {...register("notes")} rows={2}
            placeholder="Notas adicionales sobre la receta..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none"
          />
        </div>

        {/* Secciones extra */}
        {extraSections.map(section => (
          <ExtraSectionCard
            key={section.id}
            section={section}
            onUpdate={updateSection}
            onRemove={() => removeSection(section.id)}
          />
        ))}

        {/* Botón + Agregar sección */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(v => !v)}
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-emerald-400 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
          >
            <Plus size={15} />
            Agregar sección
            <ChevronDown size={13} className={`transition-transform ${showMenu ? "rotate-180" : ""}`} />
          </button>

          {showMenu && (
            <div className="absolute left-0 mt-1 w-56 bg-white rounded-xl border border-gray-100 shadow-md z-10 overflow-hidden">
              {[
                { type: "graduation" as const, label: "Graduación",  desc: "Tabla OD/OI adicional" },
                { type: "treatments" as const, label: "Tratamientos", desc: "Chips de tratamiento" },
                { type: "notes"      as const, label: "Notas libres", desc: "Campo de texto" },
              ].map(({ type, label, desc }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addSection(type)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading}
            className="bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors">
            {loading ? "Guardando..." : "Guardar receta"}
          </button>
          <Link href={`/patients/${patientId}`}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
