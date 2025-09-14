"use client"

import Image from "next/image"
import Link from "next/link"
// swap to your actual path if different
import coverImage from "../../../../images/coverImage_4K_sharp_cinematic.png"

const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden border-b border-ui-border-base">
      <div className="relative min-h-[62svh] md:min-h-[72svh] lg:min-h-[82svh]">
        {/* Background image */}
        <Image
          src={coverImage}
          alt="Neue Kollektion"
          priority
          fill
          sizes="100vw"
          className="object-cover object-[70%_center] md:object-[60%_center]"
        />

        {/* Soft left gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/50 to-transparent md:from-white/50" />

        {/* Content block */}
        <div className="absolute inset-x-4 sm:inset-x-8 md:left-12 md:right-auto top-1/2 -translate-y-1/2 max-w-xl">
          <div className="inline-flex items-center rounded-full bg-black/80 px-3 py-1 text-[11px] tracking-widest text-white">
            NEW KOLLEKTION
          </div>

          <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight text-gray-900">
            Inspiration. Auswahl. Überraschung.
          </h1>

          <p className="mt-3 text-sm sm:text-base text-gray-700">
            Elegante Silhouetten und satte Töne für die neue Saison.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/store?sort=new"
              className="inline-flex items-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-900"
            >
              Jetzt entdecken
            </Link>
            <Link
              href="/store"
              className="inline-flex items-center rounded-full px-5 py-3 text-sm font-medium ring-1 ring-black/15 hover:bg-black/5"
            >
              Alle Produkte
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
