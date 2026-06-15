"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import WhatsAppButton from "@/components/WhatsAppButton"

const STATUS_STYLES: Record<string, string> = {
  pendiente:  "bg-yellow-50 text-yellow-700 border border-yellow-200",
  confirmado: "bg-blue-50 text-blue-700 border border-blue-200",
  presente:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  ausente:    "bg-red-50 text-red-600 border border-red-200",
  cancelado:  "bg-gray-50 text-gray-400 border border-gray-200 opacity-50",
}

const TYPE_LABELS: Record<string, string> = {
  examen_visual: "Examen visual",
  control:       "Control",
  entrega:       "Entrega",
  eleccion:      "Elección",
  otro:          "Otro",
}

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

interface Appointment {
  id: string
  scheduled_at: string
  duration_minutes: number
  type: string
  status: string
  notes: string | null
  patients: { first_name: string; last_name: string; phone?: string | null } | null
}

export default function WeekCalendar({ appointments }: { appointments: Appointment[] }) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))

  const weekDays = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return d
    }), [weekStart])

  const byDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    for (const apt of appointments) {
      const key = toDateKey(new Date(apt.scheduled_at))
      if (!map[key]) map[key] = []
      map[key].push(apt)
    }
    for (const key in map) {
      map[key].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    }
    return map
  }, [appointments])

  const todayKey = toDateKey(new Date())

  const rangeLabel = () => {
    const end = weekDays[5]
    const s = weekStart.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    const e = end.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })
    return `${s} — ${e}`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate() - 7); return d })}
            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={13} />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[200px] text-center">
            {rangeLabel()}
          </span>
          <button
            onClick={() => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate() + 7); return d })}
            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={13} />
          </button>
        </div>
        <button
          onClick={() => setWeekStart(getMonday(new Date()))}
          className="text-xs text-emerald-700 font-medium hover:underline"
        >
          Hoy
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-6 divide-x divide-gray-100" style={{ minHeight: 420 }}>
        {weekDays.map((day, i) => {
          const key = toDateKey(day)
          const apts = byDay[key] ?? []
          const isToday = key === todayKey

          return (
            <div key={key} className={cn("flex flex-col", isToday && "bg-emerald-50/20")}>
              {/* Day header */}
              <div className={cn(
                "px-2 py-2 text-center border-b border-gray-100 sticky top-0",
                isToday ? "bg-emerald-50" : "bg-white"
              )}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{DAYS_ES[i]}</p>
                <p className={cn(
                  "text-sm font-bold mt-0.5",
                  isToday ? "text-emerald-700" : "text-gray-700"
                )}>
                  {day.getDate()}
                </p>
              </div>

              {/* Appointments */}
              <div className="flex-1 p-1 space-y-1 overflow-hidden">
                {apts.map(apt => (
                  <div
                    key={apt.id}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-[11px] transition-all",
                      STATUS_STYLES[apt.status] ?? "bg-gray-50 text-gray-600 border border-gray-200"
                    )}
                  >
                    <Link href={`/agenda/${apt.id}`} className="block hover:brightness-95">
                      <div className="flex items-center gap-1 font-semibold">
                        <Clock size={9} />
                        {formatTime(apt.scheduled_at)}
                      </div>
                      <p className="truncate font-medium mt-0.5">
                        {apt.patients
                          ? `${apt.patients.last_name}, ${apt.patients.first_name[0]}.`
                          : "—"}
                      </p>
                      <p className="text-[10px] opacity-60 truncate">
                        {TYPE_LABELS[apt.type] ?? apt.type}
                      </p>
                    </Link>
                    {apt.patients?.phone && (
                      <div className="mt-1">
                        <WhatsAppButton
                          phone={apt.patients.phone}
                          patientName={`${apt.patients.first_name} ${apt.patients.last_name}`}
                          size="sm"
                          defaultTemplateIndex={1}
                          extraData={{
                            appointmentDate: new Date(apt.scheduled_at).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }),
                            appointmentTime: formatTime(apt.scheduled_at),
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add shortcut */}
              <div className="p-1">
                <Link
                  href={`/agenda/new?date=${key}`}
                  className="w-full flex items-center justify-center gap-1 py-1 rounded text-[11px] text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={10} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
        {Object.entries({
          pendiente: "Pendiente",
          confirmado: "Confirmado",
          presente: "Presente",
          ausente: "Ausente",
          cancelado: "Cancelado",
        }).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full border", STATUS_STYLES[k])} />
            <span className="text-[10px] text-gray-400">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const m = new Date(d)
  m.setDate(d.getDate() + diff)
  m.setHours(0, 0, 0, 0)
  return m
}

function toDateKey(d: Date): string {
  return d.toLocaleDateString("sv-SE") // YYYY-MM-DD
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  })
}
