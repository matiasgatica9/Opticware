"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, LogOut, ChevronDown, Package, Calendar, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface TopbarProps {
  userName: string
}

interface Notification {
  id: string
  type: "stock" | "appointment"
  title: string
  body: string
  urgency: "high" | "medium" | "low"
}

export default function Topbar({ userName }: TopbarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen]   = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading]     = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  // Fetch notificaciones al abrir panel (y al montar)
  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
      }
    } catch { /* silently ignore */ }
    finally { setLoading(false) }
  }

  // Cerrar panel al hacer click afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [notifOpen])

  const urgencyColor = {
    high: "bg-red-500",
    medium: "bg-amber-400",
    low: "bg-blue-400",
  }

  const typeIcon = (type: string) =>
    type === "stock"
      ? <Package size={13} className="text-amber-500 flex-shrink-0" />
      : <Calendar size={13} className="text-blue-500 flex-shrink-0" />

  const highCount = notifications.filter(n => n.urgency === "high").length
  const totalCount = notifications.length

  return (
    <header className="h-[54px] bg-white border-b border-gray-100 flex items-center justify-between px-5 flex-shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-[260px]">
        <Search size={14} className="text-gray-400" />
        <input
          type="text"
          placeholder="Buscar paciente, venta..."
          className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none flex-1"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen(!notifOpen)
              if (!notifOpen) fetchNotifications()
            }}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <Bell size={16} />
            {totalCount > 0 && (
              <span
                className={`absolute top-1 right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[9px] font-bold text-white px-0.5 ${
                  highCount > 0 ? "bg-red-500" : "bg-amber-400"
                }`}
              >
                {totalCount > 9 ? "9+" : totalCount}
              </span>
            )}
          </button>

          {/* Panel */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-30">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">Notificaciones</span>
                <button onClick={() => setNotifOpen(false)}>
                  <X size={14} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {loading ? (
                  <p className="text-xs text-gray-400 text-center py-6">Cargando...</p>
                ) : notifications.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Sin alertas por ahora 🎉</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${urgencyColor[n.urgency]}`} />
                      <div className="flex items-start gap-1.5 min-w-0">
                        {typeIcon(n.type)}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-700">{n.title}</p>
                          <p className="text-xs text-gray-500 truncate">{n.body}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-gray-100">
                <button
                  onClick={() => { fetchNotifications(); }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Actualizar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-700 font-medium">
              {userName.split(" ")[0]}
            </span>
            <ChevronDown size={13} className="text-gray-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[140px] py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <LogOut size={13} />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
