import { Metadata } from "next"

import Bestsellers from "@modules/home/components/bestsellers"
import Hero from "@modules/home/components/hero"
import { getCollectionsWithProducts } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { getCategoriesList } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Art of Gifts - Home",
  description:
    "Entdecken Sie einzigartige Geschenke für jeden Anlass bei Art of Gifts. Von personalisierten Artikeln bis hin zu handgefertigten Schätzen - finden Sie das perfekte Geschenk, das Herzen berührt.",
}

export default async function Home({
  params: { countryCode },
}: {
  params: { countryCode: string }
}) {
  const collections = await getCollectionsWithProducts(countryCode)
  const region = await getRegion(countryCode)
  const { product_categories } = await getCategoriesList(0, 6)

  if (!collections || !region) {
    return null
  }

  return (
    <>
      {product_categories && product_categories.length > 0 && (
        <div className="w-full px-2">
          <ul className="flex overflow-x-auto gap-4 md:justify-center md:flex-wrap no-scrollbar">
            {product_categories
              .filter((c) => !c.parent_category)
              .slice(0, 10) // adjust number as needed
              .map((category) => (
                <li key={category.id}>
                  <LocalizedClientLink
                    href={`/categories/${category.handle}`}
                    className="block px-4 py-2  text-sm md:text-base whitespace-nowrap text-ui-fg-base transition-colors duration-200"
                  >
                    {category.name}
                  </LocalizedClientLink>
                </li>
              ))}
          </ul>
        </div>
      )}
      <Hero />
      <div className="py-4">
        <ul className="flex flex-col gap-x-6">
          {/* Replace collections with Bestsellers */}
          <Bestsellers countryCode={countryCode} region={region} categoryHandle="bestseller" />
        </ul>
      </div>
    </>
  )
}