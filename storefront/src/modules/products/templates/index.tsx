import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"
import Back from "@modules/common/icons/back"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    image: (product.images || []).map((i) => i.url),
    description: product.description,
    sku: product.variants?.[0]?.sku,
    brand: product.collection?.title || "",
  }

  return (
    <>
      {/* Breadcrumbs */}
      <div className="content-container py-4">
        <nav
          className="text-small-regular text-ui-fg-subtle"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center gap-2">
            <li>
              <LocalizedClientLink
                href="/"
                className="hover:text-ui-fg-base"
              >
                Home
              </LocalizedClientLink>
            </li>
            <li className="text-ui-fg-muted">/</li>
            <li className="text-ui-fg-base truncate max-w-[60vw]">
              {product.title}
            </li>
          </ol>
        </nav>
      </div>

      <div
        className="content-container grid grid-cols-1 large:grid-cols-12 gap-8 py-6"
        data-testid="product-container"
      >
        {/* Gallery */}
        <div className="large:col-span-7">
          <ImageGallery images={product?.images || []} />
        </div>

        {/* Details and actions */}
        <div className="large:col-span-5 flex flex-col gap-y-8 large:sticky large:top-28 self-start">
          <div className="flex flex-col gap-y-6">
            <ProductInfo product={product} />
            <ProductOnboardingCta />
            <Suspense
              fallback={
                <ProductActions
                  disabled={true}
                  product={product}
                  region={region}
                />
              }
            >
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>
          </div>

          {/* Trust and service highlights */}
          <div className="grid grid-cols-1 gap-4 border border-ui-border-base rounded-md p-4 bg-white">
            <div className="flex items-start gap-3">
              <FastDelivery />
              <div>
                <p className="font-semibold">Schnelle Lieferung</p>
                <p className="text-ui-fg-subtle">
                  3–5 Werktage bis zu Ihrer Haustür.
                </p>
              </div>
            </div>
            {/* <div className="flex items-start gap-3">
              <Refresh />
              <div>
                <p className="font-semibold">Easy exchanges</p>
                <p className="text-ui-fg-subtle">
                  Free 14-day exchange policy.
                </p>
              </div>
            </div> */}
            {/* <div className="flex items-start gap-3">
              <Back />
              <div>
                <p className="font-semibold">Hassle-free returns</p>
                <p className="text-ui-fg-subtle">
                  30-day money-back guarantee.
                </p>
              </div>
            </div> */}
          </div>

          {/* Info tabs */}
          <ProductTabs product={product} />
        </div>
      </div>

      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>

      {/* Structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}

export default ProductTemplate
