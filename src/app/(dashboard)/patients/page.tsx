import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/lib/get-tenant"
import PatientList from "@/components/patients/PatientList"
import Link from "next/link"
import { UserPlus } from "lucide-react"

export default async function PatientsPage() {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) return null

  // Traer pacientes con la fecha de última receta
  const { data: patients } = await supabase
    .from("patients")
    .select(`
      *,
      prescriptions(issued_date)
    `)
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("last_name", { ascending: true })

  // Calcular última receta por paciente
  const patientsWithMeta = (patients ?? []).map((p) => {
    const prescs = (p.prescriptions as { issued_date: string }[]) ?? []
    const lastDate = prescs.length
      ? prescs.sort((a, b) => b.issued_date.localeCompare(a.issued_date))[0].issued_date
      : null
    const { prescriptions: _, ...patient } = p
    return { ...patient, last_prescription_date: lastDate }
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {patientsWithMeta.length} paciente{patientsWithMeta.length !== 1 ? "s" : ""} registrado{patientsWithMeta.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/patients/new"
          className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          <UserPlus size={16} />
          Nuevo paciente
        </Link>
      </div>

      <PatientList patients={patientsWithMeta} />
    </div>
  )
}
