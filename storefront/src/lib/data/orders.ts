// lib/data/orders.ts
import { HttpTypes } from "@medusajs/types"

const BACKEND =
  process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE =
  process.env.MEDUSA_PUBLISHABLE_API_KEY ??
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

if (!BACKEND) {
  // This logs on the server (Next RSC). Don't crash; the page can render a friendly message.
  console.error("MEDUSA_BACKEND_URL is missing for retrieveOrder()")
}
if (!PUBLISHABLE) {
  console.error("MEDUSA_PUBLISHABLE_API_KEY is missing for retrieveOrder()")
}

export async function retrieveOrder(
  id: string
): Promise<HttpTypes.StoreOrder | null> {
  if (!BACKEND || !PUBLISHABLE) return null

  try {
    const res = await fetch(`${BACKEND}/store/orders/${id}`, {
      headers: { "x-publishable-api-key": PUBLISHABLE },
      cache: "no-store",
    })

    if (res.status === 404) return null
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error(
        `retrieveOrder(${id}) failed: ${res.status} ${res.statusText} – ${text.slice(
          0,
          300
        )}`
      )
      return null
    }

    const data = (await res.json()) as { order: HttpTypes.StoreOrder }
    return data.order ?? null
  } catch (e) {
    console.error("retrieveOrder error:", e)
    return null
  }
}
