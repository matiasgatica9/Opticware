import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/lib/get-tenant"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const tenantId = await getTenantId(supabase)
    if (!tenantId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    let backup: any
    try {
      backup = await req.json()
    } catch {
      return NextResponse.json({ error: "Archivo inválido" }, { status: 400 })
    }

    if (!backup?.version || !backup?.data) {
      return NextResponse.json({ error: "El archivo no es un respaldo válido de OpticWare" }, { status: 400 })
    }

    const d = backup.data
    const results: Record<string, number> = {}

    // Helper: reasignar tenant_id y eliminar columnas de sistema para evitar conflictos
    const remap = (rows: any[]) =>
      rows.map(r => ({ ...r, tenant_id: tenantId }))

    // Orden de importación respetando foreign keys:
    // 1. obras_sociales, suppliers, products (independientes)
    // 2. patients (puede depender de obras_sociales)
    // 3. appointments, sales (dependen de patients)
    // 4. sale_items (dependen de sales y products)
    // 5. invoices (dependen de sales)
    // 6. invoice_items (dependen de invoices y products)
    // 7. prescriptions (dependen de patients)
    // 8. lab_orders (dependen de patients y products)

    if (d.obras_sociales?.length) {
      const { error, count } = await supabase
        .from("obras_sociales")
        .upsert(remap(d.obras_sociales), { onConflict: "id", ignoreDuplicates: true })
        .select("id", { count: "exact", head: true })
      results.obras_sociales = count ?? 0
      if (error) console.warn("[import] obras_sociales:", error.message)
    }

    if (d.suppliers?.length) {
      const { count } = await supabase
        .from("suppliers")
        .upsert(remap(d.suppliers), { onConflict: "id", ignoreDuplicates: true })
        .select("id", { count: "exact", head: true })
      results.suppliers = count ?? 0
    }

    if (d.products?.length) {
      const { count } = await supabase
        .from("products")
        .upsert(remap(d.products), { onConflict: "id", ignoreDuplicates: true })
        .select("id", { count: "exact", head: true })
      results.products = count ?? 0
    }

    if (d.patients?.length) {
      const { count } = await supabase
        .from("patients")
        .upsert(remap(d.patients), { onConflict: "id", ignoreDuplicates: true })
        .select("id", { count: "exact", head: true })
      results.patients = count ?? 0
    }

    if (d.appointments?.length) {
      const { count } = await supabase
        .from("appointments")
        .upsert(remap(d.appointments), { onConflict: "id", ignoreDuplicates: true })
        .select("id", { count: "exact", head: true })
      results.appointments = count ?? 0
    }

    if (d.prescriptions?.length) {
      const { count } = await supabase
        .from("prescriptions")
        .upsert(remap(d.prescriptions), { onConflict: "id", ignoreDuplicates: true })
        .select("id", { count: "exact", head: true })
      results.prescriptions = count ?? 0
    }

    if (d.sales?.length) {
      const { count } = await supabase
        .from("sales")
        .upsert(remap(d.sales), { onConflict: "id", ignoreDuplicates: true })
        .select("id", { count: "exact", head: true })
      results.sales = count ?? 0
    }

    if (d.sale_items?.length) {
      const { count } = await supabase
        .from("sale_items")
        .upsert(d.sale_items, { onConflict: "id", ignoreDuplicates: true })
        .select("id", { count: "exact", head: true })
      results.sale_items = count ?? 0
    }

    if (d.invoices?.length) {
      const { count } = await supabase
        .from("invoices")
        .upsert(remap(d.invoices), { onConflict: "id", ignoreDuplicates: true })
        .select("id", { count: "exact", head: true })
      results.invoices = count ?? 0
    }

    if (d.invoice_items?.length) {
      const { count } = await supabase
        .from("invoice_items")
        .upsert(d.invoice_items, { onConflict: "id", ignoreDuplicates: true })
        .select("id", { count: "exact", head: true })
      results.invoice_items = count ?? 0
    }

    if (d.lab_orders?.length) {
      const { count } = await supabase
        .from("lab_orders")
        .upsert(remap(d.lab_orders), { onConflict: "id", ignoreDuplicates: true })
        .select("id", { count: "exact", head: true })
      results.lab_orders = count ?? 0
    }

    return NextResponse.json({
      success: true,
      message: "Respaldo importado correctamente",
      imported: results,
    })
  } catch (e) {
    console.error("[POST /api/backup/import]", e)
    return NextResponse.json({ error: "Error al importar el respaldo" }, { status: 500 })
  }
}
