"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, Calendar, ShoppingCart,
  Box, Truck, BarChart2, FileText, Settings,
  ChevronRight, PanelLeftClose, PanelLeftOpen, Code2, Heart, FlaskConical,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/patients", icon: Users, label: "Pacientes" },
  { href: "/agenda", icon: Calendar, label: "Agenda", badge: 5 },
  { href: "/sales", icon: ShoppingCart, label: "Ventas" },
]

const navBusiness = [
  { href: "/stock",       icon: Box,          label: "Stock", badge: 3 },
  { href: "/lab-orders",  icon: FlaskConical, label: "Laboratorio" },
  { href: "/obras-sociales", icon: Heart,     label: "Obras Sociales" },
  { href: "/suppliers",   icon: Truck,        label: "Proveedores" },
  { href: "/reports",     icon: BarChart2,    label: "Reportes" },
]

const navSystem = [
  { href: "/invoicing", icon: FileText, label: "Facturación" },
  { href: "/settings", icon: Settings, label: "Configuración" },
]

interface SidebarProps {
  businessName: string
  logoUrl: string | null
  primaryColor: string
  userInitials: string
  userName: string
  userRole: string
}

export default function Sidebar({
  businessName,
  logoUrl,
  primaryColor,
  userInitials,
  userName,
  userRole,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const color = primaryColor || "#0F6E56"

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-200 overflow-hidden",
        collapsed ? "w-[52px] min-w-[52px]" : "w-[200px] min-w-[200px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b border-gray-100 min-h-[54px]",
          collapsed ? "flex-col justify-center gap-2 py-2" : "px-3 justify-between"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName}
                className="w-7 h-7 rounded-lg object-contain flex-shrink-0"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: color }}
              >
                {businessName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-[13px] font-medium text-gray-900 truncate">{businessName}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: color }}
          >
            {businessName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors flex-shrink-0"
        >
          {collapsed ? (
            <PanelLeftOpen size={13} />
          ) : (
            <PanelLeftClose size={13} />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-1.5 py-2 flex flex-col gap-0.5 overflow-hidden">
        <NavGroup
          items={navItems}
          collapsed={collapsed}
          pathname={pathname}
          color={color}
        />

        {!collapsed && (
          <p className="text-[10px] text-gray-400 uppercase tracking-widest px-2 pt-3 pb-1">
            Negocio
          </p>
        )}
        {collapsed && <div className="h-2" />}
        <NavGroup
          items={navBusiness}
          collapsed={collapsed}
          pathname={pathname}
          color={color}
        />

        {!collapsed && (
          <p className="text-[10px] text-gray-400 uppercase tracking-widest px-2 pt-3 pb-1">
            Sistema
          </p>
        )}
        {collapsed && <div className="h-2" />}
        <NavGroup
          items={navSystem}
          collapsed={collapsed}
          pathname={pathname}
          color={color}
        />
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 px-2 py-2.5">
        <div
          className={cn(
            "flex items-center gap-2",
            collapsed && "justify-center"
          )}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {userInitials}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-[12px] font-medium text-gray-900 truncate">{userName}</p>
              <p className="text-[11px] text-gray-400 capitalize">{userRole}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1 mt-2.5 px-0.5">
            <Code2 size={10} className="text-gray-300" />
            <span className="text-[10px] text-gray-300">
              Creado por <span className="text-gray-400 font-medium">OpticWare</span>
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}

function NavGroup({
  items,
  collapsed,
  pathname,
  color,
}: {
  items: { href: string; icon: React.ElementType; label: string; badge?: number }[]
  collapsed: boolean
  pathname: string
  color: string
}) {
  return (
    <>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/")
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md text-[13px] transition-colors relative group",
              collapsed ? "justify-center p-2" : "px-2 py-1.5",
              active
                ? "font-medium"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            )}
            style={
              active
                ? { backgroundColor: `${color}18`, color }
                : undefined
            }
          >
            <Icon size={16} className="flex-shrink-0" />
            {!collapsed && <span className="flex-1">{item.label}</span>}
            {!collapsed && item.badge && (
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
            {/* Tooltip en modo colapsado */}
            {collapsed && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {item.label}
                {item.badge ? ` (${item.badge})` : ""}
              </span>
            )}
          </Link>
        )
      })}
    </>
  )
}
