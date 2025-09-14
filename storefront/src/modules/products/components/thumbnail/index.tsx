import Image from "next/image"
import React from "react"
import { clx } from "@medusajs/ui"
import PlaceholderImage from "@modules/common/icons/placeholder-image"

type ThumbnailProps = {
  thumbnail?: string | null
  // TODO: refine typings
  images?: { url?: string | null }[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "full",
  isFeatured,
  className,
  "data-testid": dataTestid,
}) => {
  const src = thumbnail || images?.[0]?.url || undefined
  const isSquare = size === "square"

  return (
    <div
      className={clx(
        // clean, edge-to-edge image
        "group relative w-full overflow-hidden rounded-none bg-transparent p-0 shadow-none",
        // consistent, editorial ratio (wider feel)
        isSquare ? "aspect-square" : "aspect-[3/4]",
        className
      )}
      data-testid={dataTestid}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          draggable={false}
          // slightly higher quality; tweak if needed
          quality={70}
          sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
          priority={!!isFeatured}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-neutral-100 text-neutral-400">
          <PlaceholderImage size={size === "small" ? 16 : 24} />
        </div>
      )}
    </div>
  )
}

export default Thumbnail
