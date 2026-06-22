import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/lib/get-tenant"

export async function GET() {
  try {
    const supabase = await createClient()
    const tenantId = await getTenantId(supabase)
    if (!tenantId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    // Traer todos los datos del tenant en paralelo
    const [
      patientsRes,
      prescriptionsRes,
      appointmentsRes,
      productsRes,
      salesRes,
      saleItemsRes,
      invoicesRes,
      invoiceItemsRes,
      labOrdersRes,
      suppliersRes,
      obrasSocialesRes,
    ] = await Promise.all([
      supabase.from("patients").select("*").eq("tenant_id", tenantId),
      supabase.from("prescriptions").select("*").eq("tenant_id", tenantId),
      supabase.from("appointments").select("*").eq("tenant_id", tenantId),
      supabase.from("products").select("*").eq("tenant_id", tenantId),
      supabase.from("sales").select("*").eq("tenant_id", tenantId),
      supabase.from("sale_items").select("*"),
      supabase.from("invoices").select("*").eq("tenant_id", tenantId),
      supabase.from("invoice_items").select("*"),
      supabase.from("lab_orders").select("*").eq("tenant_id", tenantId),
      supabase.from("suppliers").select("*").eq("tenant_id", tenantId),
      supabase.from("obras_sociales").select("*").eq("tenant_id", tenantId),
    ])

    // Filtrar sale_items e invoice_items por los IDs que le pertenecen al tenant
    const saleIds = new Set((salesRes.data ?? []).map(s => s.id))
    const invoiceIds = new Set((invoicesRes.data ?? []).map(i => i.id))

    const backup = {
      version: "1.0",
      exported_at: new Date().toISOString(),
      tenant_id: tenantId,
      data: {
        patients:       patientsRes.data       ?? [],
        prescriptions:  prescriptionsRes.data  ?? [],
        appointments:   appointmentsRes.data   ?? [],
        products:       productsRes.data       ?? [],
        obras_sociales: obrasSocialesRes.data  ?? [],
        suppliers:      suppliersRes.data      ?? [],
        sales:          salesRes.data          ?? [],
        sale_items:     (saleItemsRes.data ?? []).filter(i => saleIds.has(i.sale_id)),
        invoices:       invoicesRes.data       ?? [],
        invoice_items:  (invoiceItemsRes.data ?? []).filter(i => invoiceIds.has(i.invoice_id)),
        lab_orders:     labOrdersRes.data      ?? [],
      },
    }

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="opticware-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (e) {
    console.error("[GET /api/backup/export]", e)
    return NextResponse.json({ error: "Error al exportar" }, { status: 500 })
  }
}
