import { Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import { getProductsById } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

function hasTag(p: HttpTypes.StoreProduct, ...tags: string[]) {
  const set = new Set((p.tags || []).map(t => t.value?.toLowerCase()))
  return tags.some(t => set.has(t))
}
function isNew(p: HttpTypes.StoreProduct) {
  if (hasTag(p, "new")) return true
  const created = p.created_at ? new Date(p.created_at).getTime() : 0
  return Date.now() - created < 1000 * 60 * 60 * 24 * 30 // 30 days
}
function isBestSeller(p: HttpTypes.StoreProduct) {
  return (
    hasTag(p, "best seller", "best-seller", "bestseller") ||
    p.collection?.handle === "best-seller"
  )
}
function getColorCount(p: HttpTypes.StoreProduct) {
  const colorOpt =
    p.options?.find(
      (o) =>
        o.title?.toLowerCase() === "color" || o.title?.toLowerCase() === "farbe"
    ) ?? null
  if (!colorOpt) return 0
  const values = new Set<string>()
  for (const v of p.variants || []) {
    for (const vo of v.options || []) {
      if (vo.option_id === colorOpt.id && vo.value) values.add(vo.value)
    }
  }
  return values.size
}

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const [pricedProduct] = await getProductsById({
    ids: [product.id!],
    regionId: region.id,
  })
  if (!pricedProduct) return null

  const { cheapestPrice } = getProductPrice({ product: pricedProduct })
  const onSale = cheapestPrice?.price_type === "sale"
  const colorCount = getColorCount(pricedProduct)

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group block">
      <div data-testid="product-wrapper" className="relative">
        {/* image */}
        <div className="relative overflow-hidden">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
          />
          {/* top-left badges */}
          <div className="absolute left-3 top-3 flex gap-2">
            {isBestSeller(pricedProduct) && (
              <span className="px-2 py-1 text-[10px] leading-none tracking-widest uppercase bg-white/90 border border-neutral-300 text-neutral-800">
                BEST SELLER
              </span>
            )}
            {isNew(pricedProduct) && (
              <span className="px-2 py-1 text-[10px] leading-none tracking-widest uppercase bg-white/90 border border-neutral-300 text-neutral-800">
                NEW
              </span>
            )}
          </div>
        </div>

        {/* meta */}
        <div className="mt-4 text-center">
          <Text className="text-[13px] tracking-wide uppercase text-ui-fg-base" data-testid="product-title">
            {product.title}
          </Text>

          {/* price: red sale + struck original */}
          {cheapestPrice && (
            <div className="mt-1 flex items-center justify-center gap-2">
              {onSale && (
                <span className="line-through text-neutral-400">
                  {cheapestPrice.original_price}
                </span>
              )}
              <span className={onSale ? "text-red-600" : ""}>
                {cheapestPrice.calculated_price}
              </span>
            </div>
          )}

          {colorCount > 0 && (
            <div className="mt-1 text-[12px] text-neutral-500">
              {colorCount} farbe
            </div>
          )}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
