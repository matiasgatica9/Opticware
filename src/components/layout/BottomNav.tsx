"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, Calendar, ShoppingCart,
  MoreHorizontal, X, Box, Heart, Truck, BarChart2,
  FileText, Settings, FlaskConical,
} from "lucide-react"
import { cn } from "@/lib/utils"

const mainNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "/patients",  icon: Users,           label: "Pacientes" },
  { href: "/agenda",    icon: Calendar,        label: "Agenda" },
  { href: "/sales",     icon: ShoppingCart,    label: "Ventas" },
]

const moreNav = [
  { href: "/stock",          icon: Box,          label: "Stock" },
  { href: "/lab-orders",     icon: FlaskConical, label: "Laboratorio" },
  { href: "/obras-sociales", icon: Heart,        label: "Obras Sociales" },
  { href: "/suppliers",      icon: Truck,        label: "Proveedores" },
  { href: "/reports",        icon: BarChart2,    label: "Reportes" },
  { href: "/invoicing",      icon: FileText,     label: "Facturación" },
  { href: "/settings",       icon: Settings,     label: "Configuración" },
]

interface BottomNavProps {
  primaryColor?: string
}

export default function BottomNav({ primaryColor = "#0F6E56" }: BottomNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isMoreActive = moreNav.some(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/")
  )

  return (
    <>
      {/* Overlay del menú "Más" */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sheet "Más" */}
      <div
        className={cn(
          "fixed bottom-16 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-gray-100 transition-transform duration-300 md:hidden",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-sm font-semibold text-gray-700">Más opciones</span>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1 px-3 pb-6 pt-1">
          {moreNav.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-colors"
                style={active ? { backgroundColor: `${primaryColor}18`, color: primaryColor } : undefined}
              >
                <Icon size={22} className={active ? "" : "text-gray-500"} />
                <span className={cn("text-[11px] font-medium text-center", active ? "" : "text-gray-500")}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Barra inferior */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex md:hidden safe-area-pb">
        {mainNav.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors"
            >
              <Icon
                size={20}
                style={active ? { color: primaryColor } : undefined}
                className={active ? "" : "text-gray-400"}
              />
              <span
                className={cn("text-[10px] font-medium", active ? "" : "text-gray-400")}
                style={active ? { color: primaryColor } : undefined}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Botón "Más" */}
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors"
        >
          <MoreHorizontal
            size={20}
            style={isMoreActive ? { color: primaryColor } : undefined}
            className={isMoreActive ? "" : "text-gray-400"}
          />
          <span
            className={cn("text-[10px] font-medium", isMoreActive ? "" : "text-gray-400")}
            style={isMoreActive ? { color: primaryColor } : undefined}
          >
            Más
          </span>
        </button>
      </nav>
    </>
  )
}
