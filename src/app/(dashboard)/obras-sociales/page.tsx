"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Heart, Pencil, Trash2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ObraSocial {
  id: string
  name: string
  code: string | null
  discount_percent: number
  copago: number
  notes: string | null
  active: boolean
}

const EMPTY: Omit<ObraSocial, "id" | "active"> = {
  name: "", code: "", discount_percent: 0, copago: 0, notes: "",
}

export default function ObrasSocialesPage() {
  const [items, setItems]       = useState<ObraSocial[]>([])
  const [loading, setLoading]   = useState(true)
  const [tenantId, setTenantId] = useState<string | null>(null)

  // Formulario inline
  const [showForm, setShowForm]   = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const [form, setForm]           = useState({ ...EMPTY })
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: ud } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
    if (!ud) return
    setTenantId(ud.tenant_id)
    const { data } = await supabase
      .from("obras_sociales")
      .select("*")
      .eq("tenant_id", ud.tenant_id)
      .order("name")
    setItems(data ?? [])
    setLoading(false)
  }

  function openNew() {
    setEditId(null)
    setForm({ ...EMPTY })
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(os: ObraSocial) {
    setEditId(os.id)
    setForm({
      name: os.name,
      code: os.code ?? "",
      discount_percent: os.discount_percent,
      copago: os.copago,
      notes: os.notes ?? "",
    })
    setFormError(null)
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
  }

  async function handleSave() {
    if (!form.name.trim()) { setFormError("El nombre es requerido"); return }
    setSaving(true)
    setFormError(null)
    const supabase = createClient()

    const payload = {
      name:             form.name.trim(),
      code:             form.code?.trim() || null,
      discount_percent: Number(form.discount_percent) || 0,
      copago:           Number(form.copago) || 0,
      notes:            form.notes?.trim() || null,
    }

    if (editId) {
      await supabase.from("obras_sociales").update(payload).eq("id", editId)
    } else {
      await supabase.from("obras_sociales").insert({ ...payload, tenant_id: tenantId, active: true })
    }

    setSaving(false)
    setShowForm(false)
    setEditId(null)
    load()
  }

  async function toggleActive(os: ObraSocial) {
    const supabase = createClient()
    await supabase.from("obras_sociales").update({ active: !os.active }).eq("id", os.id)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta obra social? Los pacientes y facturas vinculados quedarán sin obra social.")) return
    const supabase = createClient()
    await supabase.from("obras_sociales").delete().eq("id", id)
    load()
  }

  if (loading) return (
    <div className="h-40 flex items-center justify-center text-sm text-gray-400">Cargando...</div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Obras Sociales</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.filter(i => i.active).length} activa{items.filter(i => i.active).length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          <Plus size={15} />
          Nueva obra social
        </button>
      </div>

      {/* Formulario inline */}
      {showForm && (
        <div className="bg-white rounded-xl border border-emerald-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">
            {editId ? "Editar obra social" : "Nueva obra social"}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Nombre *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: OSDE, PAMI, IOMA..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Código / Sigla</label>
              <input
                value={form.code ?? ""}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                placeholder="Ej: OSDE, PAMI"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Descuento (%)</label>
              <div className="relative">
                <input
                  type="number" min={0} max={100} step={1}
                  value={form.discount_percent}
                  onChange={e => setForm(f => ({ ...f, discount_percent: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
              <p className="text-xs text-gray-400">Descuento aplicado al subtotal de la factura</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Copago fijo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number" min={0} step={100}
                  value={form.copago}
                  onChange={e => setForm(f => ({ ...f, copago: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 pl-7 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <p className="text-xs text-gray-400">Monto fijo que paga el paciente (0 = sin copago)</p>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-gray-600">Notas internas</label>
              <input
                value={form.notes ?? ""}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Ej: Tel. autorizaciones: 0800-XXX-XXXX"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelForm}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50"
            >
              <Check size={13} />
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {items.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-100 py-20 flex flex-col items-center text-center">
          <Heart size={36} className="text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">No hay obras sociales cargadas</p>
          <p className="text-xs text-gray-400 mt-1">Agregá las obras sociales con las que trabajás</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Nombre</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Código</th>
                <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Descuento</th>
                <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Copago</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Notas</th>
                <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">Estado</th>
                <th className="w-20 px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map(os => (
                <tr key={os.id} className={cn("hover:bg-gray-50 transition-colors", !os.active && "opacity-50")}>
                  <td className="px-5 py-3 font-medium text-gray-900">{os.name}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {os.code ? (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{os.code}</span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {os.discount_percent > 0 ? (
                      <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                        {os.discount_percent}% desc.
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Sin desc.</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center text-gray-600 text-xs">
                    {os.copago > 0 ? `$${os.copago.toLocaleString("es-AR")}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs max-w-[180px] truncate">
                    {os.notes || "—"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => toggleActive(os)}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium transition-colors",
                        os.active
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      {os.active ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(os)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(os.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-300 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
