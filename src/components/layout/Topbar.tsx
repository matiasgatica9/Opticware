"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, LogOut, ChevronDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface TopbarProps {
  userName: string
}

export default function Topbar({ userName }: TopbarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

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
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

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
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
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
