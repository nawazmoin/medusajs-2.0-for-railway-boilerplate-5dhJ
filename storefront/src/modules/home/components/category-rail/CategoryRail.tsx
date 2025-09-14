"use client"

import { useEffect, useRef, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ChevronLeftMini, ChevronRightMini } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"

type Props = { categories: HttpTypes.StoreProductCategory[] }

export default function CategoryRail({ categories }: Props) {
    const list = categories.filter((c) => !c.parent_category)

    const ref = useRef<HTMLUListElement>(null)
    const [canPrev, setCanPrev] = useState(false)
    const [canNext, setCanNext] = useState(false)
    const [overflowing, setOverflowing] = useState(false)

    const measure = () => {
        const el = ref.current
        if (!el) return
        const { scrollLeft, scrollWidth, clientWidth } = el
        setOverflowing(scrollWidth > clientWidth + 1)
        setCanPrev(scrollLeft > 0)
        setCanNext(scrollLeft + clientWidth < scrollWidth - 1)
    }

    useEffect(() => {
        measure()
        const el = ref.current
        if (!el) return
        el.addEventListener("scroll", measure, { passive: true })
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => {
            el.removeEventListener("scroll", measure)
            ro.disconnect()
        }
    }, [])

    const scrollByDir = (dir: number) => {
        const el = ref.current
        if (!el) return
        el.scrollBy({
            left: dir * Math.max(320, el.clientWidth * 0.9),
            behavior: "smooth",
        })
    }

    return (
        <div className="relative w-full">
            {/* subtle edge fades only when it actually overflows */}
            {overflowing && (
                <>
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent z-10" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent z-10" />
                </>
            )}

            {/* arrows – always rendered, disabled at ends; square + high contrast */}
            <button
                type="button"
                aria-label="Previous categories"
                onClick={() => scrollByDir(-1)}
                disabled={!canPrev}
                className="absolute left-2 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center bg-black text-white ring-1 ring-black/15 hover:bg-black disabled:opacity-30"
            >
                <ChevronLeftMini className="h-4 w-4" />
            </button>
            <button
                type="button"
                aria-label="Next categories"
                onClick={() => scrollByDir(1)}
                disabled={!canNext}
                className="absolute right-2 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center bg-black text-white ring-1 ring-black/15 hover:bg-black disabled:opacity-30"
            >
                <ChevronRightMini className="h-4 w-4" />
            </button>

            {/* scroller */}
            <ul
                ref={ref}
                className="no-scrollbar flex flex-nowrap gap-4 overflow-x-auto scroll-px-6 px-2 md:px-4 py-3"
            >
                {list.map((c) => (
                    <li key={c.id} className="shrink-0">
                        <LocalizedClientLink
                            href={`/categories/${c.handle}`}
                            className="group relative inline-flex px-2 md:px-3 py-2 text-sm md:text-base font-medium text-ui-fg-base hover:text-black"
                        >
                            {c.name}
                            <span
                                aria-hidden
                                className="absolute left-0 right-0 -bottom-[2px] h-px bg-transparent transition-colors duration-200 group-hover:bg-black"
                            />
                        </LocalizedClientLink>
                    </li>
                ))}
            </ul>
        </div>
    )
}
