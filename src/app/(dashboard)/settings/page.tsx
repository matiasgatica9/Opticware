"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { getTenantIdClient } from "@/lib/get-tenant-client"
import { Upload, Check, AlertCircle, Download, FolderOpen, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const PRESET_COLORS = [
  "#0F6E56", // esmeralda (default)
  "#1D4ED8", // azul
  "#7C3AED", // violeta
  "#DC2626", // rojo
  "#D97706", // amber
  "#0891B2", // cyan
  "#374151", // gris oscuro
  "#BE185D", // rosa
]

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-4">
        {children}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function SaveButton({ loading, saved, onClick }: { loading: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50",
        saved
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-emerald-700 text-white hover:bg-emerald-800"
      )}
    >
      {saved ? <><Check size={13} /> Guardado</> : loading ? "Guardando..." : "Guardar cambios"}
    </button>
  )
}

export default function SettingsPage() {
  const [tenantId, setTenantId]       = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploading, setUploading]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Branding
  const [businessName, setBusinessName] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#0F6E56")
  const [brandingSaved, setBrandingSaved] = useState(false)
  const [brandingLoading, setBrandingLoading] = useState(false)

  // Facturación
  const [puntoVenta, setPuntoVenta]     = useState("")
  const [facturaSaved, setFacturaSaved] = useState(false)
  const [facturaLoading, setFacturaLoading] = useState(false)

  // Backup
  const [exportLoading, setExportLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [importError, setImportError]   = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  // Error global
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const tid = await getTenantIdClient()
      if (!tid) return
      setTenantId(tid)
      const { data: tenant } = await supabase.from("tenants").select("*").eq("id", tid).single()
      if (!tenant) return
      setBusinessName(tenant.business_name ?? "")
      setPrimaryColor(tenant.primary_color ?? "#0F6E56")
      setLogoPreview(tenant.logo_url ?? null)
      setPuntoVenta(tenant.afip_punto_venta?.toString() ?? "")
    }
    load()
  }, [])

  async function uploadLogo(file: File) {
    if (!tenantId) return
    setUploading(true)
    setError(null)
    const supabase = createClient()
    const ext = file.name.split(".").pop()
    const path = `${tenantId}/logo.${ext}`
    const { error: upErr } = await supabase.storage
      .from("tenant-logos")
      .upload(path, file, { upsert: true })
    if (upErr) { setError("Error al subir el logo"); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from("tenant-logos").getPublicUrl(path)
    await supabase.from("tenants").update({ logo_url: publicUrl }).eq("id", tenantId)
    setLogoPreview(publicUrl)
    setUploading(false)
  }

  async function patchTenant(fields: Record<string, unknown>, setLoading: (v: boolean) => void, setSaved: (v: boolean) => void) {
    setLoading(true)
    try {
      const res = await fetch("/api/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? "Error al guardar")
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  async function saveBranding() {
    await patchTenant({ business_name: businessName, primary_color: primaryColor }, setBrandingLoading, setBrandingSaved)
  }

  async function saveFactura() {
    await patchTenant({ punto_venta: puntoVenta }, setFacturaLoading, setFacturaSaved)
  }

  async function handleExport() {
    setExportLoading(true)
    try {
      const res = await fetch("/api/backup/export")
      if (!res.ok) { setError("Error al exportar los datos"); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `opticware-backup-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError("Error al exportar los datos")
    } finally {
      setExportLoading(false)
    }
  }

  async function handleImport(file: File) {
    setImportLoading(true)
    setImportResult(null)
    setImportError(null)
    try {
      const text = await file.text()
      const res = await fetch("/api/backup/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      })
      const json = await res.json()
      if (!res.ok) {
        setImportError(json.error ?? "Error al importar")
      } else {
        const totals = Object.entries(json.imported as Record<string, number>)
          .map(([k, v]) => `${v} ${k}`)
          .join(", ")
        setImportResult(`Importado correctamente: ${totals}`)
      }
    } catch {
      setImportError("Error al leer el archivo")
    } finally {
      setImportLoading(false)
      if (importRef.current) importRef.current.value = ""
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ajustes de tu óptica en OpticWare</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* ── Identidad ── */}
      <Section title="Identidad" description="Nombre y branding que verán tus usuarios en la app">
        {/* Logo */}
        <Field label="Logo" hint="JPG, PNG o SVG · máx. 2 MB">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-gray-300 transition-colors bg-gray-50"
              onClick={() => fileRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Upload size={18} className="text-gray-300" />
              )}
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {uploading ? "Subiendo..." : "Subir logo"}
              </button>
              {logoPreview && (
                <button
                  onClick={async () => {
                    if (!tenantId) return
                    const supabase = createClient()
                    await supabase.from("tenants").update({ logo_url: null }).eq("id", tenantId)
                    setLogoPreview(null)
                  }}
                  className="block text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Eliminar logo
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) uploadLogo(file)
              }}
            />
          </div>
        </Field>

        {/* Nombre */}
        <Field label="Nombre de la óptica">
          <input
            value={businessName}
            onChange={e => { setBusinessName(e.target.value); setBrandingSaved(false) }}
            placeholder="Ej: Óptica Visión Clara"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
          />
        </Field>

        {/* Color primario */}
        <Field label="Color primario" hint="Se usa en el sidebar y elementos de acción">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => { setPrimaryColor(color); setBrandingSaved(false) }}
                  className={cn(
                    "w-8 h-8 rounded-lg border-2 transition-all",
                    primaryColor === color ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={e => { setPrimaryColor(e.target.value); setBrandingSaved(false) }}
                className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <span className="text-sm font-mono text-gray-600">{primaryColor}</span>
              {/* Preview sidebar item */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
              >
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: primaryColor }} />
                Preview
              </div>
            </div>
          </div>
        </Field>

        <div className="flex justify-end pt-1">
          <SaveButton loading={brandingLoading} saved={brandingSaved} onClick={saveBranding} />
        </div>
      </Section>

      {/* ── Facturación ── */}
      <Section title="Facturación" description="Configuración del punto de venta para la numeración de comprobantes">
        <Field label="Punto de venta" hint="Prefijo que aparece antes del guión en la factura (ej: 0001-00000001, FC-00000001)">
          <input
            type="text"
            value={puntoVenta}
            onChange={e => { setPuntoVenta(e.target.value); setFacturaSaved(false) }}
            placeholder="0001"
            autoComplete="off"
            className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
          />
        </Field>
        <div className="flex justify-end pt-1">
          <SaveButton loading={facturaLoading} saved={facturaSaved} onClick={saveFactura} />
        </div>
      </Section>

      {/* ── WhatsApp ── */}
      <Section title="WhatsApp" description="Cómo funciona el envío de mensajes a pacientes">
        <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-lg px-4 py-3 text-sm text-green-800">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-lg">💬</span>
          </div>
          <div>
            <p className="font-medium">Funciona sin configuración</p>
            <p className="mt-0.5 text-green-700 text-xs leading-relaxed">
              Los botones de WhatsApp en turnos, ventas y laboratorio abren directamente WhatsApp en tu dispositivo con el mensaje pre-escrito listo para enviar. No necesitás ninguna API ni cuenta adicional.
            </p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-700">¿Cómo funciona?</p>
          <p>1. Hacés clic en "Enviar WhatsApp" desde un turno, venta o trabajo de laboratorio.</p>
          <p>2. Se abre WhatsApp (web o app) con el mensaje ya escrito.</p>
          <p>3. Solo confirmás el envío desde tu propio WhatsApp.</p>
        </div>
      </Section>

      {/* ── Datos y Respaldo ── */}
      <Section title="Datos y Respaldo" description="Exportá o restaurá toda la información de tu óptica">

        {/* Exportar */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Download size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Descargar respaldo</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Descargá un archivo JSON con todos tus pacientes, ventas, facturas, productos y más.
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <Download size={14} />
            {exportLoading ? "Exportando..." : "Descargar"}
          </button>
        </div>

        <div className="border-t border-gray-50" />

        {/* Importar */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <FolderOpen size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Restaurar respaldo</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Cargá un archivo de respaldo previo. Los datos existentes no se borran — solo se agregan los que faltan.
              </p>
            </div>
          </div>
          <button
            onClick={() => importRef.current?.click()}
            disabled={importLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <FolderOpen size={14} />
            {importLoading ? "Importando..." : "Cargar archivo"}
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleImport(file)
            }}
          />
        </div>

        {/* Resultado import */}
        {importResult && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 text-sm text-emerald-700">
            <Check size={14} className="flex-shrink-0" />
            {importResult}
          </div>
        )}
        {importError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-700">
            <AlertCircle size={14} className="flex-shrink-0" />
            {importError}
          </div>
        )}

        {/* Nota legal */}
        <div className="flex items-start gap-2 bg-gray-50 rounded-lg px-4 py-3">
          <ShieldCheck size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400">
            El archivo de respaldo contiene datos personales de tus pacientes. Guardalo en un lugar seguro y no lo compartás con terceros no autorizados. Ley 25.326 de Protección de Datos Personales.
          </p>
        </div>
      </Section>

      {/* Footer OpticWare — no editable */}
      <div className="text-center py-2">
        <p className="text-xs text-gray-300">
          OpticWare · Creado por <span className="text-gray-400 font-medium">OpticWare</span>
        </p>
      </div>
    </div>
  )
}
