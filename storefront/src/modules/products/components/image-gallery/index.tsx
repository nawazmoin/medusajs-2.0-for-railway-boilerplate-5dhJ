'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Image from "next/image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const hasImages = Array.isArray(images) && images.length > 0
  const [active, setActive] = useState(0)
  const [isLightboxOpen, setLightboxOpen] = useState(false)
  const mobileScrollRef = useRef<HTMLDivElement | null>(null)

  // Clamp active index if images change
  useEffect(() => {
    if (!hasImages) return
    if (active > images.length - 1) setActive(0)
  }, [images, active, hasImages])

  const openLightbox = useCallback((idx: number) => {
    setActive(idx)
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  const goPrev = useCallback(() => {
    if (!hasImages) return
    setActive((i) => (i - 1 + images.length) % images.length)
  }, [images, hasImages])

  const goNext = useCallback(() => {
    if (!hasImages) return
    setActive((i) => (i + 1) % images.length)
  }, [images, hasImages])

  const onMobileScroll = useCallback(() => {
    const el = mobileScrollRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    if (!Number.isNaN(idx) && idx !== active) {
      const clamped = Math.max(0, Math.min(images.length - 1, idx))
      setActive(clamped)
    }
  }, [active, images.length])

  const scrollToIndex = useCallback((idx: number) => {
    const el = mobileScrollRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(images.length - 1, idx))
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" })
  }, [images.length])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox()
      if (e.key === "ArrowLeft") goPrev()
      if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isLightboxOpen, closeLightbox, goPrev, goNext])

  // Derived URLs for safety
  const urls = useMemo(() => (hasImages ? images.map((i) => i.url).filter(Boolean) as string[] : []), [images, hasImages])

  if (!hasImages) {
    return (
      <div className="flex items-center justify-center w-full">
        <Container className="relative aspect-[4/3] w-full bg-ui-bg-subtle flex items-center justify-center rounded-rounded">
          <span className="text-ui-fg-muted text-small-regular">No images available</span>
        </Container>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* Mobile carousel */}
      <div className="small:hidden relative">
        <div
          ref={mobileScrollRef}
          onScroll={onMobileScroll}
          className="relative w-full overflow-x-auto no-scrollbar snap-x snap-mandatory"
        >
          <div className="flex w-full">
            {urls.map((u, idx) => (
              <div key={u + idx} className="relative w-full shrink-0 snap-center aspect-[4/5]">
                <Image
                  src={u}
                  alt={`Product image ${idx + 1}`}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority={idx === 0}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => openLightbox(active)}
            className="absolute right-3 top-3 z-[1] px-3 py-1 rounded-md bg-white/80 border border-ui-border-base text-ui-fg-base text-small-regular hover:bg-white"
          >
            Zoom
          </button>
        </div>

        {/* Dots */}
        <div className="mt-3 flex items-center justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={`dot-${i}`}
              aria-label={`Go to image ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                active === i ? "bg-ui-fg-base" : "bg-ui-border-base"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop gallery */}
      <div className="hidden small:flex gap-4">
        {/* Thumbnails */}
        <div className="hidden small:flex small:flex-col gap-3 w-20 shrink-0 small:max-h-[70vh] small:overflow-y-auto no-scrollbar">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              aria-label={`View image ${idx + 1}`}
              aria-current={active === idx}
              onClick={() => setActive(idx)}
              className={`relative aspect-square w-20 overflow-hidden rounded-md border transition ${
                active === idx ? "border-ui-fg-base" : "border-ui-border-base hover:border-ui-fg-muted"
              }`}
            >
              {img.url && (
                <Image
                  src={img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>

        {/* Main image */}
        <div className="relative flex-1">
          <Container className="relative w-full overflow-hidden bg-ui-bg-subtle rounded-rounded aspect-[4/5] small:aspect-auto small:h-[70vh] small:max-h-[800px]">
            {urls[active] && (
              <Image
                key={urls[active]}
                src={urls[active]}
                priority={active === 0}
                alt={`Product image ${active + 1}`}
                fill
                sizes="(max-width: 1024px) 70vw, 800px"
                className="object-cover"
              />
            )}

            {/* Hover overlay + open button (desktop) */}
            <div className="absolute inset-0 hidden small:flex items-end justify-end p-3">
              <button
                type="button"
                onClick={() => openLightbox(active)}
                className="px-3 py-1 rounded-md bg-white/80 border border-ui-border-base text-ui-fg-base text-small-regular hover:bg-white"
              >
                Zoom
              </button>
            </div>
          </Container>

          {/* Prev/Next controls */}
          {images.length > 1 && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
              <button
                type="button"
                aria-label="Previous image"
                onClick={goPrev}
                className="h-9 w-9 rounded-full bg-white/80 border border-ui-border-base hover:bg-white flex items-center justify-center"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={goNext}
                className="h-9 w-9 rounded-full bg-white/80 border border-ui-border-base hover:bg-white flex items-center justify-center"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center">
          <button
            type="button"
            aria-label="Close"
            onClick={closeLightbox}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>

          {images.length > 1 && (
            <button
              type="button"
              aria-label="Previous image"
              onClick={goPrev}
              className="absolute left-4 md:left-8 h-10 w-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}

          <div className="relative w-[92vw] max-w-5xl aspect-[4/3]">
            {urls[active] && (
              <Image
                src={urls[active]}
                alt={`Product image ${active + 1}`}
                fill
                sizes="(max-width: 1280px) 92vw, 1024px"
                className="object-contain"
                priority
              />
            )}
          </div>

          {images.length > 1 && (
            <button
              type="button"
              aria-label="Next image"
              onClick={goNext}
              className="absolute right-4 md:right-8 h-10 w-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
