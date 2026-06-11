"use client"

import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { value: "",            label: "Todos" },
  { value: "armazones",   label: "Armazones" },
  { value: "lentes",      label: "Lentes" },
  { value: "contactologia", label: "Contactología" },
  { value: "accesorios",  label: "Accesorios" },
  { value: "sol",         label: "Sol" },
  { value: "otro",        label: "Otro" },
]

export default function StockFilters({
  current,
  byCategory,
}: {
  current?: string
  byCategory: Record<string, number>
}) {
  const router = useRouter()
  const pathname = usePathname()

  function go(value: string) {
    const params = new URLSearchParams()
    if (value) params.set("category", value)
    router.push(`${pathname}${value ? `?${params}` : ""}`)
  }

  const total = Object.values(byCategory).reduce((s, n) => s + n, 0)

  return (
    <>
      {CATEGORIES.map(({ value, label }) => {
        const active = (current ?? "") === value
        const count = value === "" ? total : (byCategory[value] ?? 0)
        return (
          <button
            key={value}
            onClick={() => go(value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-emerald-700 text-white"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            )}
          >
            {label}
            <span className={cn(
              "text-[10px] px-1 py-0.5 rounded-full",
              active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
            )}>
              {count}
            </span>
          </button>
        )
      })}
    </>
  )
}
