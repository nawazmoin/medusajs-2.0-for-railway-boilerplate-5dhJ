"use client"

import { Button } from "@medusajs/ui"
import { OnApproveActions, OnApproveData } from "@paypal/paypal-js"
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useMemo, useState } from "react"
import ErrorMessage from "../error-message"
import Spinner from "@modules/common/icons/spinner"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { isManual, isPaypal, isStripe } from "@lib/constants"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const sessions = cart.payment_collection?.payment_sessions ?? []
  // Prefer a "pending" session, otherwise take the first
  const paymentSession =
    sessions.find((s) => s.status === "pending") ?? sessions[0]

  switch (true) {
    case isStripe(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )

    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )

    case isPaypal(paymentSession?.provider_id):
      return (
        <PayPalPaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )

    default:
      return <Button disabled>Select a payment method</Button>
  }
}

const GiftCardPaymentButton = () => {
  const [submitting, setSubmitting] = useState(false)

  const handleOrder = async () => {
    setSubmitting(true)
    await placeOrder()
  }

  return (
    <Button
      onClick={handleOrder}
      isLoading={submitting}
      data-testid="submit-order-button"
    >
      Place order
    </Button>
  )
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  // Select the Stripe session explicitly
  const session = useMemo(
    () =>
      cart.payment_collection?.payment_sessions?.find((s) =>
        isStripe(s.provider_id)
      ),
    [cart.payment_collection?.payment_sessions]
  )

  const disabled = !stripe || !elements

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart || !session?.data?.client_secret) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session.data.client_secret as string, {
        payment_method: {
          card,
          billing_details: {
            name:
              (cart.billing_address?.first_name ?? "") +
              " " +
              (cart.billing_address?.last_name ?? ""),
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = (error as any).payment_intent
          if (pi && (pi.status === "requires_capture" || pi.status === "succeeded")) {
            onPaymentCompleted()
          }
          setErrorMessage(error.message || null)
          return
        }

        if (
          paymentIntent &&
          (paymentIntent.status === "requires_capture" || paymentIntent.status === "succeeded")
        ) {
          return onPaymentCompleted()
        }
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const PayPalPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const intent = process.env.NEXT_PUBLIC_PAYPAL_INTENT || "authorize"

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  // Explicitly select the PayPal session
  const session = useMemo(
    () =>
      cart.payment_collection?.payment_sessions?.find((s) =>
        isPaypal(s.provider_id)
      ),
    [cart.payment_collection?.payment_sessions]
  )

  // Extract the backend-created PayPal order id
  const orderId =
    (session?.data as any)?.paypalOrderId ??
    (session?.data as any)?.paypal_order_id ??
    (session?.data as any)?.order_id ??
    (session?.data as any)?.orderId ??
    (session?.data as any)?.id ??
    null

  const [{ isPending, isResolved }] = usePayPalScriptReducer()

  // If SDK still loading, or we don't have an order id yet, show a spinner
  if (!isResolved || isPending || !orderId) {
    return <Spinner />
  }

  const handlePayment = async (_data: OnApproveData, actions: OnApproveActions) => {
    try {
      setSubmitting(true)
      const res =
        intent === "capture"
          ? await actions.order!.capture()
          : await actions.order!.authorize()

      if (res?.status !== "COMPLETED") {
        setErrorMessage(`An error occurred, status: ${res?.status ?? "UNKNOWN"}`)
        setSubmitting(false)
        return
      }

      await onPaymentCompleted()
    } catch {
      setErrorMessage("An unknown error occurred, please try again.")
      setSubmitting(false)
    }
  }

  return (
    <>
      <PayPalButtons
        style={{ layout: "horizontal" }}
        // IMPORTANT: return the backend-created PayPal order id
        createOrder={() => orderId as string}
        onApprove={handlePayment}
        disabled={notReady || submitting}
        data-testid={dataTestId}
      />
      <ErrorMessage
        error={errorMessage}
        data-testid="paypal-payment-error-message"
      />
    </>
  )
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = () => {
    setSubmitting(true)
    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid="submit-order-button"
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
