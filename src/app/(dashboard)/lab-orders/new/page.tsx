"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, Search, DollarSign } from "lucide-react"

const PAYMENT_METHODS = [
  { value: "efectivo",      label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "debito",        label: "Débito" },
  { value: "credito",       label: "Crédito" },
  { value: "mercadopago",   label: "MercadoPago" },
]

const WORK_TYPES = [
  { value: "lentes",      label: "Lentes oftálmicos" },
  { value: "montaje",     label: "Montaje" },
  { value: "tratamiento", label: "Tratamiento / Antirreflejo" },
  { value: "reparacion",  label: "Reparación de armazón" },
  { value: "contacto",    label: "Lentes de contacto" },
  { value: "otro",        label: "Otro" },
]

const TREATMENTS = [
  { value: "antirreflejo",  label: "Antirreflejo" },
  { value: "fotocromático", label: "Fotocromático" },
  { value: "uv",            label: "UV" },
  { value: "blue_light",    label: "Blue light" },
  { value: "endurecido",    label: "Endurecido" },
]

const LENS_TYPES = ["Monofocal", "Bifocal", "Progresivo", "Ocupacional"]
const LENS_MATERIALS = ["CR-39", "Policarbonato", "Trivex", "Alto índice 1.67", "Alto índice 1.74", "Cristal mineral"]

interface Patient { id: string; first_name: string; last_name: string }

export default function NewLabOrderPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [patients, setPatients]           = useState<Patient[]>([])
  const [patientSearch, setPatientSearch] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showDropdown, setShowDropdown]   = useState(false)

  // Graduación
  const [grad, setGrad] = useState({
    od_sphere: "", od_cylinder: "", od_axis: "", od_addition: "", od_pd: "",
    oi_sphere: "", oi_cylinder: "", oi_axis: "", oi_addition: "", oi_pd: "",
  })
  const [lensType, setLensType]         = useState("")
  const [lensMaterial, setLensMaterial] = useState("")
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([])
  const setGradField = (k: string, v: string) => setGrad(p => ({ ...p, [k]: v }))
  const toggleTreatment = (v: string) =>
    setSelectedTreatments(p => p.includes(v) ? p.filter(t => t !== v) : [...p, v])

  const [form, setForm] = useState({
    work_type:        "lentes",
    work_description: "",
    lab_name:         "",
    priority:         "normal",
    estimated_days:   "",
    order_date:       new Date().toISOString().slice(0, 10),
    notes:            "",
    // pago
    price:            "",
    payment_type:     "ninguno", // ninguno | seña | total
    deposit:          "",
    deposit_method:   "efectivo",
  })

  // Buscar pacientes
  useEffect(() => {
    if (patientSearch.length < 2) { setPatients([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .or(`first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%`)
        .eq("active", true)
        .limit(8)
      setPatients(data ?? [])
      setShowDropdown(true)
    }, 250)
    return () => clearTimeout(timer)
  }, [patientSearch])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.work_description.trim()) { setError("Ingresá la descripción del trabajo"); return }
    setLoading(true)
    setError(null)

    // Calcular fecha estimada de retorno
    let estimated_return: string | null = null
    if (form.estimated_days && parseInt(form.estimated_days) > 0) {
      const d = new Date(form.order_date)
      d.setDate(d.getDate() + parseInt(form.estimated_days))
      estimated_return = d.toISOString().slice(0, 10)
    }

    // Calcular campos de pago
    const today = new Date().toISOString().slice(0, 10)
    const priceNum   = form.price   ? parseFloat(form.price)   : null
    const depositNum = form.deposit ? parseFloat(form.deposit) : null

    let depositValue: number | null = null
    let depositDate:  string | null = null
    let depositMethod: string | null = null
    let balancePaidDate: string | null = null
    let balanceMethod: string | null = null

    if (form.payment_type === "seña" && depositNum && depositNum > 0) {
      depositValue  = depositNum
      depositDate   = today
      depositMethod = form.deposit_method
    } else if (form.payment_type === "total" && priceNum && priceNum > 0) {
      // Pago total hoy
      depositValue    = priceNum
      depositDate     = today
      depositMethod   = form.deposit_method
      balancePaidDate = today
      balanceMethod   = form.deposit_method
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: userData } = await supabase
      .from("users").select("tenant_id").eq("id", user!.id).single()

    const toNum = (s: string) => { const n = parseFloat(s.replace(",",".")); return isNaN(n) ? null : n }
    const toInt = (s: string) => { const n = parseInt(s); return isNaN(n) ? null : n }

    const { data: order, error: err } = await supabase
      .from("lab_orders")
      .insert({
        tenant_id:          userData!.tenant_id,
        patient_id:         selectedPatient?.id ?? null,
        created_by:         user!.id,
        work_type:          form.work_type,
        work_description:   form.work_description,
        lab_name:           form.lab_name || null,
        priority:           form.priority,
        estimated_days:     form.estimated_days ? parseInt(form.estimated_days) : null,
        estimated_return,
        order_date:         form.order_date,
        notes:              form.notes || null,
        status:             "en_preparacion",
        // pago
        price:              priceNum,
        deposit:            depositValue ?? 0,
        deposit_date:       depositDate,
        deposit_method:     depositMethod,
        balance_paid_date:  balancePaidDate,
        balance_method:     balanceMethod,
        // graduación
        od_sphere:    toNum(grad.od_sphere),
        od_cylinder:  toNum(grad.od_cylinder),
        od_axis:      toInt(grad.od_axis),
        od_addition:  toNum(grad.od_addition),
        od_pd:        toNum(grad.od_pd),
        oi_sphere:    toNum(grad.oi_sphere),
        oi_cylinder:  toNum(grad.oi_cylinder),
        oi_axis:      toInt(grad.oi_axis),
        oi_addition:  toNum(grad.oi_addition),
        oi_pd:        toNum(grad.oi_pd),
        lens_type:    lensType || null,
        lens_material: lensMaterial || null,
        treatments:   selectedTreatments.length > 0 ? selectedTreatments : null,
      })
      .select("id")
      .single()

    if (err || !order) {
      setError("Error al crear el trabajo. Intentá de nuevo.")
      setLoading(false)
      return
    }

    router.push(`/lab-orders/${order.id}`)
  }

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  // Saldo pendiente calculado para mostrar preview
  const priceNum   = form.price   ? parseFloat(form.price)   : 0
  const depositNum = form.deposit ? parseFloat(form.deposit) : 0
  const pendingBalance = priceNum > 0 && form.payment_type === "seña"
    ? priceNum - depositNum
    : 0

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/lab-orders"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Nuevo trabajo de laboratorio</h1>
          <p className="text-sm text-gray-500">Registrá y hacé seguimiento del trabajo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

        {/* Paciente */}
        <div className="p-5 space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Paciente</label>
          {selectedPatient ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-emerald-800">
                {selectedPatient.first_name} {selectedPatient.last_name}
              </span>
              <button
                type="button"
                onClick={() => { setSelectedPatient(null); setPatientSearch("") }}
                className="text-xs text-emerald-600 hover:underline"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar paciente..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none"
                />
              </div>
              {showDropdown && patients.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                  {patients.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(p)
                        setPatientSearch(`${p.first_name} ${p.last_name}`)
                        setShowDropdown(false)
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      {p.first_name} {p.last_name}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">Opcional — podés dejarlo sin paciente</p>
            </div>
          )}
        </div>

        {/* Tipo de trabajo */}
        <div className="p-5 space-y-3">
          <label className="block text-sm font-medium text-gray-700">Tipo de trabajo *</label>
          <div className="grid grid-cols-2 gap-2">
            {WORK_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => set("work_type", t.value)}
                className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                  form.work_type === t.value
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-medium"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Descripción */}
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción del trabajo *
            </label>
            <textarea
              value={form.work_description}
              onChange={e => set("work_description", e.target.value)}
              placeholder="Ej: Lentes progresivos con antirreflejo, graduación OD +2.00 -0.50 x 90°, OI +1.75..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
            <input
              type="text"
              value={form.lab_name}
              onChange={e => set("lab_name", e.target.value)}
              placeholder="Nombre del laboratorio"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Graduación */}
        <div className="p-5 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">Graduación <span className="text-gray-400 font-normal">(opcional)</span></h2>

          {/* Tabla OD / OI */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="w-12 pb-2" />
                  {["Esfera","Cilindro","Eje","Adición","DIP"].map(h => (
                    <th key={h} className="pb-2 text-xs font-medium text-gray-500 text-center px-1">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(["od","oi"] as const).map(eye => (
                  <tr key={eye}>
                    <td className="pr-2 py-2">
                      <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">{eye.toUpperCase()}</span>
                    </td>
                    {[
                      { key: `${eye}_sphere`,   ph: "-2.00" },
                      { key: `${eye}_cylinder`, ph: "-0.75" },
                      { key: `${eye}_axis`,     ph: "165"   },
                      { key: `${eye}_addition`, ph: "+2.00" },
                      { key: `${eye}_pd`,       ph: "32"    },
                    ].map(({ key, ph }) => (
                      <td key={key} className="px-1 py-2">
                        <input
                          value={grad[key as keyof typeof grad]}
                          onChange={e => setGradField(key, e.target.value)}
                          placeholder={ph}
                          className="w-full text-center px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cristal y Material */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo de cristal</label>
              <select
                value={lensType}
                onChange={e => setLensType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              >
                <option value="">— Seleccionar —</option>
                {LENS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Material</label>
              <select
                value={lensMaterial}
                onChange={e => setLensMaterial(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              >
                <option value="">— Seleccionar —</option>
                {LENS_MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Tratamientos */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">Tratamientos</label>
            <div className="flex flex-wrap gap-2">
              {TREATMENTS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleTreatment(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedTreatments.includes(value)
                      ? "bg-emerald-700 text-white border-emerald-700"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fechas y prioridad */}
        <div className="p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del pedido</label>
            <input
              type="date"
              value={form.order_date}
              onChange={e => set("order_date", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Días en laboratorio</label>
            <input
              type="number"
              min="1"
              max="90"
              value={form.estimated_days}
              onChange={e => set("estimated_days", e.target.value)}
              placeholder="7"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            {form.estimated_days && parseInt(form.estimated_days) > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Retorno estimado:{" "}
                {(() => {
                  const d = new Date(form.order_date)
                  d.setDate(d.getDate() + parseInt(form.estimated_days))
                  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
                })()}
              </p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
            <div className="flex gap-3">
              {["normal", "urgente"].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("priority", p)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
                    form.priority === p
                      ? p === "urgente"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p === "urgente" ? "🔴 Urgente" : "🟢 Normal"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PAGO */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign size={15} className="text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Precio y pago</label>
          </div>

          {/* Precio total */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Precio total del trabajo</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => set("price", e.target.value)}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tipo de pago */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">¿El paciente pagó algo hoy?</label>
            <div className="flex gap-2">
              {[
                { value: "ninguno", label: "No pagó" },
                { value: "seña",    label: "Dejó seña" },
                { value: "total",   label: "Pagó todo" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("payment_type", opt.value)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    form.payment_type === opt.value
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Seña: monto + método */}
          {form.payment_type === "seña" && (
            <div className="space-y-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Monto de la seña</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.deposit}
                    onChange={e => set("deposit", e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 border border-amber-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  />
                </div>
                {pendingBalance > 0 && (
                  <p className="text-xs text-amber-700 mt-1 font-medium">
                    Saldo pendiente al retirar: ${pendingBalance.toLocaleString("es-AR")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Forma de pago</label>
                <div className="flex flex-wrap gap-1.5">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => set("deposit_method", m.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        form.deposit_method === m.value
                          ? "border-amber-500 bg-amber-100 text-amber-800"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pago total: sólo método */}
          {form.payment_type === "total" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-emerald-700">
                {priceNum > 0 ? `Pagó $${priceNum.toLocaleString("es-AR")} — trabajo completamente abonado` : "Registrá también el precio total arriba"}
              </p>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Forma de pago</label>
                <div className="flex flex-wrap gap-1.5">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => set("deposit_method", m.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        form.deposit_method === m.value
                          ? "border-emerald-600 bg-emerald-100 text-emerald-800"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notas */}
        <div className="p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones internas</label>
          <textarea
            value={form.notes}
            onChange={e => set("notes", e.target.value)}
            placeholder="Notas internas del equipo..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none"
          />
        </div>

        {/* Submit */}
        <div className="p-5">
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creando..." : "Crear trabajo"}
          </button>
        </div>
      </form>
    </div>
  )
}
