import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/lib/get-tenant"

export async function GET() {
  try {
    const supabase = await createClient()
    const tenantId = await getTenantId(supabase)
    if (!tenantId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const now = new Date()
    const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString()
    const todayEnd   = new Date(now.setHours(23, 59, 59, 999)).toISOString()

    const [stockRes, appointmentsRes] = await Promise.all([
      // Productos con stock bajo (filtramos en JS porque PostgREST no soporta comparar dos columnas)
      supabase
        .from("products")
        .select("id, name, stock, stock_min")
        .eq("tenant_id", tenantId)
        .eq("active", true)
        .order("stock", { ascending: true }),

      // Turnos pendientes de hoy
      supabase
        .from("appointments")
        .select("id, scheduled_at, patients(first_name, last_name)")
        .eq("tenant_id", tenantId)
        .eq("status", "pendiente")
        .gte("scheduled_at", todayStart)
        .lte("scheduled_at", todayEnd)
        .order("scheduled_at", { ascending: true })
        .limit(5),
    ])

    const notifications: Array<{
      id: string
      type: "stock" | "appointment"
      title: string
      body: string
      urgency: "high" | "medium" | "low"
    }> = []

    // Stock bajo — filtrar en JS los que tienen stock <= stock_min
    const lowStock = (stockRes.data ?? []).filter(p => p.stock <= p.stock_min)
    for (const p of lowStock) {
      notifications.push({
        id: `stock-${p.id}`,
        type: "stock",
        title: "Stock bajo",
        body: `${p.name}: ${p.stock} unidad${p.stock !== 1 ? "es" : ""} (mín ${p.stock_min})`,
        urgency: p.stock === 0 ? "high" : "medium",
      })
    }

    // Turnos de hoy
    for (const a of appointmentsRes.data ?? []) {
      const patient = (a.patients as any)
      const hora = new Date(a.scheduled_at).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })
      notifications.push({
        id: `appt-${a.id}`,
        type: "appointment",
        title: "Turno hoy",
        body: `${hora} — ${patient?.first_name ?? ""} ${patient?.last_name ?? ""}`.trim(),
        urgency: "low",
      })
    }

    return NextResponse.json({ notifications, count: notifications.length })
  } catch (e) {
    console.error("[GET /api/notifications]", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
