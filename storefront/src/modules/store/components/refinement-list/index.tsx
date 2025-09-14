"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import SortProducts, { SortOptions } from "./sort-products"

type Props = { sortBy: SortOptions; "data-testid"?: string }

export default function RefinementList({ sortBy, "data-testid": dt }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    router.push(`${pathname}?${query}`)
  }

  // Top-right toolbar style, responsive
  return (
    <div className="">
      <div className="flex items-center justify-end">
        <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} data-testid={dt} />
      </div>
    </div>
  )
}
