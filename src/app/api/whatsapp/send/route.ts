import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Normaliza número argentino a formato internacional WhatsApp
// Argentina: +54 9 (área)(número) — sin el 0 inicial ni el 15
function normalizeArgPhone(raw: string): string {
  // Quitar espacios, guiones, paréntesis
  let n = raw.replace(/[\s\-().+]/g, "")

  // Si ya empieza con 549 o 54 lo dejamos
  if (n.startsWith("549")) return n
  if (n.startsWith("54")) {
    // Puede ser 5411XXXXXXXX → agregar 9 después del 54
    return "549" + n.slice(2)
  }

  // Si empieza con 0 (ej: 011, 0221) → quitar el 0
  if (n.startsWith("0")) n = n.slice(1)

  // Si empieza con 15 (móvil sin código de área) → no podemos normalizar bien
  // Se asume que el usuario ingresó código de área + número
  return "549" + n
}

export async function POST(req: NextRequest) {
  try {
    const { to, message, tenantId } = await req.json()

    if (!to || !message || !tenantId) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
    }

    // Verificar que el usuario autenticado pertenece a ese tenant
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: ud } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
    if (!ud || ud.tenant_id !== tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Obtener credenciales del tenant
    const { data: tenant } = await supabase
      .from("tenants")
      .select("whatsapp_phone_id, whatsapp_token, business_name")
      .eq("id", tenantId)
      .single()

    if (!tenant?.whatsapp_phone_id || !tenant?.whatsapp_token) {
      return NextResponse.json(
        { error: "WhatsApp no configurado. Configurá el Phone ID y Access Token en Ajustes." },
        { status: 422 }
      )
    }

    const toNormalized = normalizeArgPhone(to)

    const metaRes = await fetch(
      `https://graph.facebook.com/v19.0/${tenant.whatsapp_phone_id}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tenant.whatsapp_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to:                toNormalized,
          type:              "text",
          text:              { body: message },
        }),
      }
    )

    const metaData = await metaRes.json()

    if (!metaRes.ok) {
      const errMsg = metaData?.error?.message ?? "Error al enviar mensaje"
      return NextResponse.json({ error: errMsg }, { status: metaRes.status })
    }

    return NextResponse.json({ success: true, messageId: metaData.messages?.[0]?.id })
  } catch (err) {
    console.error("WhatsApp send error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
