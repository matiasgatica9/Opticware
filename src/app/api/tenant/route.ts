import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/lib/get-tenant"

// ── Esquema de validación ───────────────────────────────────────────────
const updateSchema = z.object({
  business_name:       z.string().min(1).max(200).trim().optional(),
  primary_color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido").optional(),
  logo_url:            z.string().url("URL de logo inválida").max(500).optional().nullable(),
  // punto_venta es un alias de afip_punto_venta (1-999)
  punto_venta:         z.number().int().min(1).max(999).optional().nullable(),
  // WhatsApp Business — tokens son sensibles, limitamos longitud
  whatsapp_phone_id:   z.string().max(100).trim().optional().nullable(),
  whatsapp_token:      z.string().max(500).trim().optional().nullable(),
})

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const tenantId = await getTenantId(supabase)
    if (!tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    let raw: unknown
    try { raw = await req.json() } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
    }

    const parsed = updateSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 422 }
      )
    }

    const data = parsed.data

    // Construir objeto de updates solo con campos presentes
    const updates: Record<string, unknown> = {}
    if (data.business_name     !== undefined) updates.business_name     = data.business_name
    if (data.primary_color     !== undefined) updates.primary_color     = data.primary_color
    if (data.logo_url          !== undefined) updates.logo_url          = data.logo_url
    if (data.punto_venta       !== undefined) updates.afip_punto_venta  = data.punto_venta
    if (data.whatsapp_phone_id !== undefined) updates.whatsapp_phone_id = data.whatsapp_phone_id
    if (data.whatsapp_token    !== undefined) updates.whatsapp_token    = data.whatsapp_token

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true })
    }

    const { error } = await supabase
      .from("tenants")
      .update(updates)
      .eq("id", tenantId)

    if (error) {
      console.error("[PATCH /api/tenant]", error)
      return NextResponse.json({ error: "Error al actualizar la configuración" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[PATCH /api/tenant] unexpected:", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
