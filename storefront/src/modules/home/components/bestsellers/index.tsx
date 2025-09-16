import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import { getProductsList } from "@lib/data/products"
import { getCategoryByHandle } from "@lib/data/categories"

export default async function Bestsellers({
  countryCode,
  region,
  categoryHandle = "bestseller",
  limit = 12,
}: {
  countryCode: string
  region: HttpTypes.StoreRegion
  categoryHandle?: string
  limit?: number
}) {
  // Resolve category by handle to get its id
  const { product_categories } = await getCategoryByHandle([categoryHandle])
  const category = product_categories?.[0]

  if (!category) return null

  const {
    response: { products },
  } = await getProductsList({
    countryCode,
    queryParams: {
      limit,
      // Filter by category id for reliability
      category_id: [category.id] as any,
      fields: "*variants.calculated_price",
    } as any,
  })

  if (!products?.length) return null

  return (
    <div className="content-container py-8 small:py-12">
      <h2 className="txt-xlarge mb-6">Bestseller</h2>
      <ul className="grid grid-cols-2 small:grid-cols-3 gap-x-6 gap-y-24 small:gap-y-36">
        {products.map((product) => (
          <li key={product.id}>
            {/* @ts-ignore */}
            <ProductPreview product={product} region={region} isFeatured />
          </li>
        ))}
      </ul>
    </div>
  )
}
