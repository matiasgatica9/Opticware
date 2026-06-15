import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, Plus, Phone, Mail, MapPin, FileText, Calendar } from "lucide-react"
import { formatDate } from "@/lib/utils"
import PatientActions from "@/components/patients/PatientActions"
import WhatsAppButton from "@/components/WhatsAppButton"

const LENS_TYPE_LABELS: Record<string, string> = {
  monofocal:   "Monofocal",
  bifocal:     "Bifocal",
  progresivo:  "Progresivo",
  ocupacional: "Ocupacional",
}

const MATERIAL_LABELS: Record<string, string> = {
  cr39:              "CR-39",
  policarbonato:     "Policarbonato",
  trivex:            "Trivex",
  alto_indice_167:   "Alto índice 1.67",
  alto_indice_174:   "Alto índice 1.74",
  cristal_mineral:   "Cristal mineral",
}

const TREATMENT_LABELS: Record<string, string> = {
  antirreflejo: "Antirreflejo",
  fotocromático: "Fotocromático",
  uv:           "UV",
  blue_light:   "Blue light",
  endurecido:   "Endurecido",
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single()

  if (!patient) notFound()

  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("patient_id", id)
    .order("issued_date", { ascending: false })

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/patients"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={15} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-base font-bold">
              {patient.first_name[0]}{patient.last_name[0]}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {patient.first_name} {patient.last_name}
              </h1>
              {patient.birth_date && (
                <p className="text-sm text-gray-500">
                  {getAge(patient.birth_date)} años · Nacido el {formatDate(patient.birth_date)}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PatientActions patientId={id} />
          <Link
            href={`/patients/${id}/prescriptions/new`}
            className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
          >
            <Plus size={15} />
            Nueva receta
          </Link>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Datos personales */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Datos personales
          </h2>
          <InfoRow label="DNI" value={patient.dni} />
          <InfoRow label="Fecha nac." value={patient.birth_date ? formatDate(patient.birth_date) : null} />
          {patient.notes && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Observaciones</p>
              <p className="text-sm text-gray-700">{patient.notes}</p>
            </div>
          )}
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Contacto
          </h2>
          {patient.phone && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone size={13} className="text-gray-400" />
                {patient.phone}
              </div>
              <WhatsAppButton
                phone={patient.phone}
                patientName={`${patient.first_name} ${patient.last_name}`}
                size="sm"
              />
            </div>
          )}
          {patient.email && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail size={13} className="text-gray-400" />
              {patient.email}
            </div>
          )}
          {patient.address && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin size={13} className="text-gray-400" />
              {patient.address}
            </div>
          )}
          {!patient.phone && !patient.email && !patient.address && (
            <p className="text-sm text-gray-400">Sin datos de contacto</p>
          )}
        </div>
      </div>

      {/* Historia clínica */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Historia clínica</h2>
          </div>
          <span className="text-xs text-gray-400">
            {prescriptions?.length ?? 0} receta{(prescriptions?.length ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>

        {!prescriptions?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar size={28} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-500 font-medium">Sin recetas registradas</p>
            <p className="text-xs text-gray-400 mt-1">
              Hacé clic en "Nueva receta" para agregar la primera
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {prescriptions.map((rx) => (
              <PrescriptionCard key={rx.id} rx={rx} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PrescriptionCard({ rx }: { rx: any }) {
  const formatVal = (v: number | null, suffix = "") =>
    v !== null ? `${v > 0 ? "+" : ""}${v.toFixed(2)}${suffix}` : "—"

  const treatments = (rx.treatments as string[]) ?? []

  return (
    <div className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
      {/* Date + doctor */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {formatDate(rx.issued_date)}
          </span>
          {rx.issued_by && (
            <span className="text-xs text-gray-400">· {rx.issued_by}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {rx.lens_type && (
            <Tag>{LENS_TYPE_LABELS[rx.lens_type] ?? rx.lens_type}</Tag>
          )}
          {rx.lens_material && (
            <Tag>{MATERIAL_LABELS[rx.lens_material] ?? rx.lens_material}</Tag>
          )}
        </div>
      </div>

      {/* OD / OI grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <EyeCard
          label="OD — Ojo derecho"
          sphere={rx.od_sphere}
          cylinder={rx.od_cylinder}
          axis={rx.od_axis}
          addition={rx.od_addition}
          pd={rx.od_pd}
        />
        <EyeCard
          label="OI — Ojo izquierdo"
          sphere={rx.oi_sphere}
          cylinder={rx.oi_cylinder}
          axis={rx.oi_axis}
          addition={rx.oi_addition}
          pd={rx.oi_pd}
        />
      </div>

      {/* Treatments */}
      {treatments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {treatments.map((t) => (
            <span
              key={t}
              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
            >
              {TREATMENT_LABELS[t] ?? t}
            </span>
          ))}
        </div>
      )}

      {/* Notes */}
      {rx.notes && (
        <p className="text-xs text-gray-500 mt-2 italic">{rx.notes}</p>
      )}
    </div>
  )
}

function EyeCard({
  label,
  sphere, cylinder, axis, addition, pd,
}: {
  label: string
  sphere: number | null
  cylinder: number | null
  axis: number | null
  addition: number | null
  pd: number | null
}) {
  const fmt = (v: number | null) =>
    v !== null ? `${v > 0 ? "+" : ""}${v.toFixed(2)}` : "—"
  const fmtInt = (v: number | null) => (v !== null ? v.toString() : "—")

  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
      <p className="text-[11px] text-gray-400 font-medium mb-1.5">{label}</p>
      <div className="grid grid-cols-5 gap-1 text-center">
        {[
          { l: "Esf.", v: fmt(sphere) },
          { l: "Cil.", v: fmt(cylinder) },
          { l: "Eje", v: fmtInt(axis) },
          { l: "Add.", v: fmt(addition) },
          { l: "DIP", v: fmtInt(pd) },
        ].map(({ l, v }) => (
          <div key={l}>
            <p className="text-[10px] text-gray-400">{l}</p>
            <p className="text-sm font-medium text-gray-800">{v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
      {children}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm text-gray-700">
        {value ?? <span className="text-gray-300">—</span>}
      </span>
    </div>
  )
}

function getAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}
