import { NextResponse } from "next/server"
import { createClient }  from "@/lib/supabase/server"

// GET /api/catalog?category=lens_type|lens_material|treatment
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: userData } = await supabase
    .from("users").select("tenant_id").eq("id", user.id).single()

  const url  = new URL(req.url)
  const cat  = url.searchParams.get("category")

  let query = supabase
    .from("catalog_items")
    .select("id, category, label")
    .eq("tenant_id", userData!.tenant_id)
    .order("created_at", { ascending: true })

  if (cat) query = query.eq("category", cat)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/catalog  body: { category, label }
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: userData } = await supabase
    .from("users").select("tenant_id").eq("id", user.id).single()

  const { category, label } = await req.json()
  if (!category || !label?.trim())
    return NextResponse.json({ error: "category y label requeridos" }, { status: 400 })

  const { data, error } = await supabase
    .from("catalog_items")
    .insert({ tenant_id: userData!.tenant_id, category, label: label.trim() })
    .select("id, category, label")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// DELETE /api/catalog?id=uuid
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  const { error } = await supabase
    .from("catalog_items")
    .delete()
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
