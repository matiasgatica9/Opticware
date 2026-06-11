"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, Phone, Mail, MapPin, User, Save, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORY_LABELS: Record<string, string> = {
  armazones:    "Armazones",
  lentes:       "Lentes",
  contactologia:"Contactología",
  accesorios:   "Accesorios",
  sol:          "Sol",
  laboratorio:  "Laboratorio",
  otro:         "Otro",
}

export default function SupplierDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [supplier, setSupplier] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("suppliers").select("*").eq("id", id).single()
      setSupplier(data)
      setForm(data ?? {})
      setLoading(false)
    }
    load()
  }, [id])

  async function saveEdit() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from("suppliers").update({
      name:         form.name,
      contact_name: form.contact_name || null,
      phone:        form.phone || null,
      email:        form.email || null,
      address:      form.address || null,
      category:     form.category,
      notes:        form.notes || null,
    }).eq("id", id)
    setSupplier({ ...supplier, ...form })
    setEditing(false)
    setSaving(false)
  }

  async function archive() {
    if (!confirm("¿Archivar este proveedor?")) return
    const supabase = createClient()
    await supabase.from("suppliers").update({ active: false }).eq("id", id)
    router.push("/suppliers")
  }

  const f = (field: string, value: string) => setForm((p: any) => ({ ...p, [field]: value }))

  if (loading) return <div className="h-40 flex items-center justify-center text-sm text-gray-400">Cargando...</div>
  if (!supplier) return <div className="text-sm text-gray-500">Proveedor no encontrado.</div>

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/suppliers" className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={15} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">{supplier.name}</h1>
          <p className="text-xs text-gray-400">{CATEGORY_LABELS[supplier.category ?? "otro"]}</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <button onClick={() => setEditing(true)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Editar
            </button>
          ) : (
            <>
              <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors">
                <Save size={12} /> Guardar
              </button>
              <button onClick={() => { setEditing(false); setForm(supplier) }} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Datos */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Información</h2>

        {editing ? (
          <div className="space-y-3">
            {[
              { field: "name", label: "Nombre *" },
              { field: "contact_name", label: "Persona de contacto" },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  value={form[field] ?? ""}
                  onChange={e => f(field, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
              <select value={form.category ?? "otro"} onChange={e => f("category", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent">
                <option value="armazones">Armazones</option>
                <option value="lentes">Lentes</option>
                <option value="contactologia">Contactología</option>
                <option value="accesorios">Accesorios</option>
                <option value="sol">Sol</option>
                <option value="laboratorio">Laboratorio</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { field: "phone", label: "Teléfono" },
                { field: "email", label: "Email" },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input value={form[field] ?? ""} onChange={e => f(field, e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
              <input value={form.address ?? ""} onChange={e => f("address", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent" />
            </div>
          </div>
        ) : (
          <dl className="space-y-3">
            {supplier.contact_name && (
              <div className="flex items-center gap-3">
                <User size={13} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700">{supplier.contact_name}</span>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-3">
                <Phone size={13} className="text-gray-400 shrink-0" />
                <a href={`tel:${supplier.phone}`} className="text-sm text-gray-700 hover:text-emerald-700 transition-colors">{supplier.phone}</a>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-3">
                <Mail size={13} className="text-gray-400 shrink-0" />
                <a href={`mailto:${supplier.email}`} className="text-sm text-gray-700 hover:text-emerald-700 transition-colors truncate">{supplier.email}</a>
              </div>
            )}
            {supplier.address && (
              <div className="flex items-start gap-3">
                <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{supplier.address}</span>
              </div>
            )}
            {!supplier.contact_name && !supplier.phone && !supplier.email && !supplier.address && (
              <p className="text-sm text-gray-400">Sin datos de contacto — hacé clic en Editar para agregar</p>
            )}
          </dl>
        )}
      </div>

      {/* Notas */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Notas</h2>
        {editing ? (
          <textarea
            value={form.notes ?? ""}
            onChange={e => f("notes", e.target.value)}
            rows={4}
            placeholder="Condiciones de pago, tiempos de entrega, observaciones..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none"
          />
        ) : (
          <p className="text-sm text-gray-600 whitespace-pre-line">
            {supplier.notes ?? <span className="text-gray-400">Sin notas</span>}
          </p>
        )}
      </div>

      {/* Archivar */}
      <button
        onClick={archive}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-100 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors"
      >
        <Trash2 size={12} />
        Archivar proveedor
      </button>
    </div>
  )
}
