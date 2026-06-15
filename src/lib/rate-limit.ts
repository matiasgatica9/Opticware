/**
 * Rate limiter de ventana deslizante en memoria.
 *
 * Funciona bien en desarrollo y en instancias serverless reutilizadas (Vercel warm).
 * Para producción de alto tráfico, reemplazá con Upstash Redis.
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

/**
 * Verifica si la IP puede hacer más requests.
 * @param key     Identificador único (ip, ip+ruta, etc.)
 * @param limit   Máximo de requests en la ventana
 * @param windowMs Ventana de tiempo en ms (default: 60 segundos)
 * @returns true si se permite, false si se bloqueó
 */
export function rateLimit(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now()

  // Limpiar entradas vencidas si la tabla crece mucho
  if (store.size > 5000) {
    for (const [k, v] of store.entries()) {
      if (now > v.resetAt) store.delete(k)
    }
  }

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

/**
 * Extrae la IP real del request (respeta proxies de Vercel/Cloudflare).
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  )
}
