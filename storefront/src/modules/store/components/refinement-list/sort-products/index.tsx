"use client"

import { ChevronDownMini } from "@medusajs/icons"
import { SortOptions } from "./sort-products" // keep the type here, or inline it

type Props = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const OPTIONS: { value: SortOptions; label: string }[] = [
  { value: "created_at", label: "Neueste Produkte" },
  { value: "price_asc", label: "Preis: Niedrig → Hoch" },
  { value: "price_desc", label: "Preis: Hoch → Niedrig" },
]

export default function SortProducts({ sortBy, setQueryParams, "data-testid": dt }: Props) {
  return (
    <div className="relative inline-block" data-testid={dt}>
      <label htmlFor="sort" className="sr-only">Sort by</label>

      <select
        id="sort"
        value={sortBy}
        onChange={(e) => setQueryParams("sortBy", e.target.value as SortOptions)}
        className="appearance-none rounded-none border border-ui-border-base bg-white px-3 py-1 pr-9
                   text-sm md:text-base leading-none text-ui-fg-base
                   hover:bg-ui-bg-subtle focus:outline-none focus:ring-1 focus:ring-black/30"
      >
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* chevron */}
      <ChevronDownMini className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-ui-fg-muted" />
    </div>
  )
}
