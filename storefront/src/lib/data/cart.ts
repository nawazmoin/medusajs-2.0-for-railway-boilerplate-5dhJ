"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { omit } from "lodash"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { getAuthHeaders, getCartId, removeCartId, setCartId } from "./cookies"
import { getProductsById } from "./products"
import { getRegion } from "./regions"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

const isCompletedCartError = (e: any) => {
  const msg = e?.message ?? e?.response?.data?.message ?? e?.toString?.() ?? ""
  const status = e?.response?.status
  return /cart.*(completed|archived)/i.test(msg) || status === 409
}

export async function retrieveCart() {
  const cartId = getCartId()
  if (!cartId) return null

  try {
    const { cart } = await sdk.store.cart.retrieve(
      cartId,
      {},
      { next: { tags: ["cart"] }, ...getAuthHeaders() }
    )

    // Guard against completed/archived carts (properties not in type)
    const completedOrArchived = Boolean(
      (cart as any)?.completed_at ||
        (cart as any)?.status === "completed" ||
        (cart as any)?.status === "archived"
    )
    if (completedOrArchived) {
      return null
    }

    return cart
  } catch {
    // Also no cookie writes here
    return null
  }
}


export async function getOrSetCart(countryCode: string) {
  let cart = await retrieveCart()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (!cart) {
    const cartResp = await sdk.store.cart.create({ region_id: region.id })
    cart = cartResp.cart
    setCartId(cart.id)
    revalidateTag("cart")
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(
      cart.id,
      { region_id: region.id },
      {},
      getAuthHeaders()
    )
    revalidateTag("cart")
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = getCartId()
  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  return sdk.store.cart
    .update(cartId, data, {}, getAuthHeaders())
    .then(({ cart }) => {
      revalidateTag("cart")
      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
  metadata,
}: {
  variantId: string
  quantity: number
  countryCode: string
  metadata?: Record<string, unknown>
}) {
  if (!variantId) throw new Error("Missing variant ID when adding to cart")

  let cart = await getOrSetCart(countryCode)
  if (!cart) throw new Error("Error retrieving or creating cart")

  const payload = { variant_id: variantId, quantity, metadata } as any

  try {
    await sdk.store.cart.createLineItem(
      cart.id,
      payload,
      {},
      getAuthHeaders()
    )
    revalidateTag("cart")
  } catch (e) {
    if (isCompletedCartError(e)) {
      // Now it's safe to clear cookie (we're in a Server Action)
      removeCartId()
      cart = await getOrSetCart(countryCode)
      await sdk.store.cart.createLineItem(
        cart.id,
        payload,
        {},
        getAuthHeaders()
      )
      revalidateTag("cart")
      return
    }
    throw medusaError(e)
  }
}


export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = getCartId()
  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, getAuthHeaders())
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = getCartId()
  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, getAuthHeaders())
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
  revalidateTag("cart")
}

export async function enrichLineItems(
  items: HttpTypes.StoreOrder["items"] | null | undefined,
  regionId: string
): Promise<HttpTypes.StoreOrder["items"]> {
  const safeItems = Array.isArray(items) ? items : []
  if (!BACKEND || !PUBLISHABLE) return safeItems as any

  try {
    const variantIds = safeItems
      .map((i) => i.variant_id)
      .filter(Boolean) as string[]

    if (variantIds.length === 0) return safeItems as any

    const url = new URL(`${BACKEND}/store/variants`)
    url.searchParams.set("ids", variantIds.join(","))
    url.searchParams.set("region_id", regionId)

    const res = await fetch(url.toString(), {
      headers: { "x-publishable-api-key": PUBLISHABLE },
      cache: "no-store",
    })

    if (!res.ok) {
      console.warn("enrichLineItems: variants fetch not ok")
      return safeItems as any
    }

    const data = (await res.json()) as any
    const byId = new Map<string, any>()
    for (const v of data.variants ?? []) byId.set(v.id, v)

    return safeItems.map((it) => {
      const v = it.variant_id ? byId.get(it.variant_id) : null
      if (!v) return it
      // merge pricing and product media into the line item variant so price components work
      const mergedVariant = {
        ...(it as any).variant,
        ...v,
        calculated_price: v.calculated_price ?? (it as any).variant?.calculated_price,
        product: {
          ...(it as any).variant?.product,
          ...v.product,
        },
      }
      return {
        ...it,
        variant: mergedVariant,
        title: (it as any).title ?? v.product?.title ?? (it as any).title,
        thumbnail:
          (it as any).thumbnail ?? v.product?.thumbnail ?? (it as any).thumbnail,
      }
    }) as any
  } catch (e) {
    console.error("enrichLineItems error:", e)
    return safeItems as any
  }
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  return sdk.store.cart
    .addShippingMethod(
      cartId,
      { option_id: shippingMethodId },
      {},
      getAuthHeaders()
    )
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: {
    provider_id: string
    context?: Record<string, unknown>
  }
) {
  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, getAuthHeaders())
    .then((resp) => {
      revalidateTag("cart")
      return resp
    })
    .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
  const cartId = getCartId()
  if (!cartId) {
    throw new Error("No existing cart found")
  }

  await updateCart({ promo_codes: codes })
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
}

export async function applyGiftCard(code: string) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function removeDiscount(code: string) {
  // const cartId = getCartId()
  // if (!cartId) return "No cartId cookie found"
  // try {
  //   await deleteDiscount(cartId, code)
  //   revalidateTag("cart")
  // } catch (error: any) {
  //   throw error
  // }
}

export async function removeGiftCard(
  codeToRemove: string,
  giftCards: any[]
  // giftCards: GiftCard[]
) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, {
  //       gift_cards: [...giftCards]
  //         .filter((gc) => gc.code !== codeToRemove)
  //         .map((gc) => ({ code: gc.code })),
  //     }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e: any) {
    return e.message
  }
}

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const data = {
      shipping_address: {
        first_name: formData.get("shipping_address.first_name"),
        last_name: formData.get("shipping_address.last_name"),
        address_1: formData.get("shipping_address.address_1"),
        address_2: "",
        company: formData.get("shipping_address.company"),
        postal_code: formData.get("shipping_address.postal_code"),
        city: formData.get("shipping_address.city"),
        country_code: formData.get("shipping_address.country_code"),
        province: formData.get("shipping_address.province"),
        phone: formData.get("shipping_address.phone"),
      },
      email: formData.get("email"),
    } as any

    const sameAsBilling = formData.get("same_as_billing")
    if (sameAsBilling === "on") data.billing_address = data.shipping_address

    if (sameAsBilling !== "on")
      data.billing_address = {
        first_name: formData.get("billing_address.first_name"),
        last_name: formData.get("billing_address.last_name"),
        address_1: formData.get("billing_address.address_1"),
        address_2: "",
        company: formData.get("billing_address.company"),
        postal_code: formData.get("billing_address.postal_code"),
        city: formData.get("billing_address.city"),
        country_code: formData.get("billing_address.country_code"),
        province: formData.get("billing_address.province"),
        phone: formData.get("billing_address.phone"),
      }
    await updateCart(data)
  } catch (e: any) {
    return e.message
  }

  redirect(
    `/${formData.get("shipping_address.country_code")}/checkout?step=delivery`
  )
}

export async function placeOrder() {
  const cartId = getCartId()
  if (!cartId) {
    throw new Error("No existing cart found when placing an order")
  }

  const cartRes = await sdk.store.cart
    .complete(cartId, {}, getAuthHeaders())
    .then((cartRes) => {
      revalidateTag("cart")
      return cartRes
    })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    const countryCode =
      cartRes.order.shipping_address?.country_code?.toLowerCase()
    removeCartId()
    redirect(`/${countryCode}/order/confirmed/${cartRes?.order.id}`)
  }

  return cartRes.cart
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await updateCart({ region_id: region.id })
    revalidateTag("cart")
  }

  revalidateTag("regions")
  revalidateTag("products")

  redirect(`/${countryCode}${currentPath}`)
}
