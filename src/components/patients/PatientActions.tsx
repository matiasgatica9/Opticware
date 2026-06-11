"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Pencil, Trash2 } from "lucide-react"

export default function PatientActions({ patientId }: { patientId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm("¿Eliminar este paciente? Se borrarán también sus recetas. Esta acción no se puede deshacer.")) return
    setDeleting(true)
    const supabase = createClient()
    // Eliminar prescripciones primero
    await supabase.from("prescriptions").delete().eq("patient_id", patientId)
    const { error } = await supabase.from("patients").delete().eq("id", patientId)
    if (error) {
      alert("Error al eliminar el paciente")
      setDeleting(false)
      return
    }
    router.push("/patients")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/patients/${patientId}/edit`}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
      >
        <Pencil size={13} />
        Editar
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <Trash2 size={13} />
        {deleting ? "Eliminando..." : "Eliminar"}
      </button>
    </div>
  )
}
