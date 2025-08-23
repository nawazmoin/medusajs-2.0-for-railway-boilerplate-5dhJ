"use client"

import { loadStripe } from "@stripe/stripe-js"
import React, { createContext, useMemo } from "react"
import StripeWrapper from "./stripe-wrapper"
import { PayPalScriptProvider } from "@paypal/react-paypal-js"
import { HttpTypes } from "@medusajs/types"
import { isPaypal, isStripe } from "@lib/constants"

type WrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

// Stripe
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

// PayPal
const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

// Contexts
export const StripeContext = createContext(false)
export const PayPalOrderContext = createContext<string | null>(null)

export default function Wrapper({ cart, children }: WrapperProps) {
  const sessions = cart?.payment_collection?.payment_sessions ?? []

  // pick sessions explicitly
  const stripeSession = useMemo(
    () => sessions.find((s) => isStripe(s.provider_id)),
    [sessions]
  )

  const paypalSession = useMemo(
    () => sessions.find((s) => isPaypal(s.provider_id)),
    [sessions]
  )

  // extract PayPal order id (provider may use one of these keys)
  const paypalOrderId =
    (paypalSession?.data as any)?.paypalOrderId ??
    (paypalSession?.data as any)?.order_id ??
    (paypalSession?.data as any)?.id ??
    null

  // memoize SDK options to prevent reloading (flicker)
  const paypalOptions = useMemo(
    () => ({
      "client-id": paypalClientId!,                         // require a real ID
      intent: "authorize",                                  // match backend
      currency: cart?.currency_code?.toUpperCase() ?? "EUR",
      components: "buttons",
    }),
    [paypalClientId, cart?.currency_code]
  )

  // Stripe branch
  if (stripeSession && stripePromise) {
    return (
      <StripeContext.Provider value={true}>
        <StripeWrapper
          paymentSession={stripeSession}
          stripeKey={stripeKey}
          stripePromise={stripePromise}
        >
          {children}
        </StripeWrapper>
      </StripeContext.Provider>
    )
  }

  // PayPal branch
  if (paypalSession && paypalClientId) {
    return (
      <PayPalScriptProvider options={paypalOptions}>
        <PayPalOrderContext.Provider value={paypalOrderId}>
          {children}
        </PayPalOrderContext.Provider>
      </PayPalScriptProvider>
    )
  }

  return <>{children}</>
}
