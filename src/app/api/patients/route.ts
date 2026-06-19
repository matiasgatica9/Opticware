import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/lib/get-tenant"

// ── Esquema de validación ───────────────────────────────────────────────
const patientSchema = z.object({
  first_name: z.string().min(1, "Nombre requerido").max(100).trim(),
  last_name:  z.string().max(100).trim().optional().nullable(),
  dni:        z.string().max(20).trim().optional().nullable(),
  phone:      z.string().max(30).trim().optional().nullable(),
  email:      z.string().max(200).trim().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  address:    z.string().max(300).trim().optional().nullable(),
  notes:      z.string().max(2000).trim().optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const tenantId = await getTenantId(supabase)
    if (!tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Parsear y validar body
    let raw: unknown
    try {
      raw = await req.json()
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
    }

    const parsed = patientSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 422 }
      )
    }

    const data = parsed.data

    const { data: patient, error } = await supabase
      .from("patients")
      .insert({
        tenant_id:  tenantId,
        first_name: data.first_name,
        last_name:  data.last_name  ?? "",
        dni:        data.dni        ?? null,
        phone:      data.phone      ?? null,
        email:      data.email      ?? null,
        birth_date: data.birth_date ?? null,
        address:    data.address    ?? null,
        notes:      data.notes      ?? null,
        active:     true,
      })
      .select("id")
      .single()

    if (error || !patient) {
      console.error("[POST /api/patients]", error)
      return NextResponse.json(
        { error: "Error al guardar el paciente" },
        { status: 500 }
      )
    }

    return NextResponse.json({ id: patient.id }, { status: 201 })
  } catch (e) {
    console.error("[POST /api/patients] unexpected:", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
