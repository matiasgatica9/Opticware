"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ChevronRight, UserX } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Patient } from "@/types/database"

interface PatientWithMeta extends Patient {
  last_prescription_date?: string | null
}

interface PatientListProps {
  patients: PatientWithMeta[]
}

export default function PatientList({ patients }: PatientListProps) {
  const [query, setQuery] = useState("")

  const filtered = patients.filter((p) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      p.dni?.includes(q) ||
      p.phone?.includes(q)
    )
  })

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 max-w-sm">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, DNI o teléfono..."
            className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UserX size={36} className="text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {query ? "No se encontraron pacientes" : "Todavía no hay pacientes"}
          </p>
          {!query && (
            <p className="text-xs text-gray-400 mt-1">
              Hacé clic en "Nuevo paciente" para agregar el primero
            </p>
          )}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Paciente
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                DNI
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Teléfono
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Última receta
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((patient) => (
              <tr
                key={patient.id}
                className="hover:bg-gray-50 transition-colors group"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/patients/${patient.id}`}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-xs font-semibold flex-shrink-0">
                      {patient.first_name[0]}{patient.last_name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {patient.last_name}, {patient.first_name}
                      </p>
                      {patient.birth_date && (
                        <p className="text-xs text-gray-400">
                          {getAge(patient.birth_date)} años
                        </p>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {patient.dni ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {patient.phone ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {patient.last_prescription_date
                    ? formatDate(patient.last_prescription_date)
                    : <span className="text-gray-300">Sin recetas</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <Link href={`/patients/${patient.id}`}>
                    <ChevronRight
                      size={16}
                      className="text-gray-300 group-hover:text-gray-400 transition-colors"
                    />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {filtered.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-50 text-xs text-gray-400">
          {filtered.length} {filtered.length === 1 ? "paciente" : "pacientes"}
          {query && ` encontrado${filtered.length !== 1 ? "s" : ""}`}
        </div>
      )}
    </div>
  )
}

function getAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}
