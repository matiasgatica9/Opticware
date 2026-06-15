import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/lib/get-tenant"

// ── Esquemas de validación ──────────────────────────────────────────────
const CATEGORIES = ["armazones", "lentes", "contactologia", "accesorios", "sol", "otro"] as const

const createSchema = z.object({
  name:      z.string().min(1, "Nombre requerido").max(200).trim(),
  category:  z.enum(CATEGORIES, { message: "Categoría inválida" }),
  sku:       z.string().max(100).trim().optional().nullable(),
  price:     z.number().min(0, "Precio debe ser ≥ 0").max(999_999_999),
  cost:      z.number().min(0).max(999_999_999).optional().nullable(),
  stock:     z.number().int().min(0).max(1_000_000).default(0),
  stock_min: z.number().int().min(0).max(1_000_000).default(5),
})

const updateSchema = z.object({
  id:        z.string().uuid("ID inválido"),
  name:      z.string().min(1).max(200).trim().optional(),
  category:  z.enum(CATEGORIES).optional(),
  sku:       z.string().max(100).trim().optional().nullable(),
  price:     z.number().min(0).max(999_999_999).optional(),
  cost:      z.number().min(0).max(999_999_999).optional().nullable(),
  stock:     z.number().int().min(0).max(1_000_000).optional(),
  stock_min: z.number().int().min(0).max(1_000_000).optional(),
  active:    z.boolean().optional(),
})

// ── POST — Crear producto ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
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

    const parsed = createSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 422 }
      )
    }

    const data = parsed.data

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        tenant_id: tenantId,
        name:      data.name,
        category:  data.category,
        sku:       data.sku       ?? null,
        price:     data.price,
        cost:      data.cost      ?? null,
        stock:     data.stock,
        stock_min: data.stock_min,
      })
      .select("id")
      .single()

    if (error || !product) {
      console.error("[POST /api/products]", error)
      return NextResponse.json({ error: "Error al guardar el producto" }, { status: 500 })
    }

    return NextResponse.json({ id: product.id }, { status: 201 })
  } catch (e) {
    console.error("[POST /api/products] unexpected:", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ── PATCH — Actualizar producto ─────────────────────────────────────────
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

    const { id, ...fields } = parsed.data

    const updates: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) updates[k] = v
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true })
    }

    const { error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", tenantId) // Garantiza que el producto pertenece al tenant

    if (error) {
      console.error("[PATCH /api/products]", error)
      return NextResponse.json({ error: "Error al actualizar el producto" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[PATCH /api/products] unexpected:", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
