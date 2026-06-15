import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/lib/get-tenant"
import WeekCalendar from "@/components/agenda/WeekCalendar"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function AgendaPage() {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) return null

  // 4 semanas atrás y 4 adelante para la navegación del calendario
  const from = new Date()
  from.setDate(from.getDate() - 28)
  const to = new Date()
  to.setDate(to.getDate() + 28)

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, scheduled_at, duration_minutes, type, status, notes, patients(first_name, last_name, phone)")
    .eq("tenant_id", tenantId)
    .gte("scheduled_at", from.toISOString())
    .lte("scheduled_at", to.toISOString())
    .order("scheduled_at", { ascending: true })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 mt-0.5">Turnos y citas</p>
        </div>
        <Link
          href="/agenda/new"
          className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          <Plus size={15} />
          Nuevo turno
        </Link>
      </div>
      <WeekCalendar appointments={(appointments ?? []) as any} />
    </div>
  )
}
