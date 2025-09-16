import { Text, Section, Hr } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { OrderDTO, OrderAddressDTO } from '@medusajs/framework/types'

export const ORDER_PLACED = 'order-placed'

interface OrderPlacedPreviewProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress: OrderAddressDTO
}

export interface OrderPlacedTemplateProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress: OrderAddressDTO
  preview?: string
}

export const isOrderPlacedTemplateData = (data: any): data is OrderPlacedTemplateProps =>
  typeof data.order === 'object' && typeof data.shippingAddress === 'object'

export const OrderPlacedTemplate: React.FC<OrderPlacedTemplateProps> & {
  PreviewProps: OrderPlacedPreviewProps
} = ({ order, shippingAddress, preview = 'Ihre Bestellung wurde bestätigt!' }) => {
  const totalText = `${order.summary.raw_current_order_total.value} ${order.currency_code}`

  return (
    <Base preview={preview}>
      <Section>
        <Text style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', margin: '0 0 30px' }}>
          Bestellbestätigung — Art Of Gifts
        </Text>

        <div
          style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text style={{ margin: '0 0 10px' }}>
            Hallo {shippingAddress.first_name} {shippingAddress.last_name},
          </Text>
          <Text style={{ margin: 0 }}>
            Vielen Dank für Ihre Bestellung bei <strong>Art Of Gifts</strong>! Die Zahlungsanweisungen erhalten Sie in Kürze per E‑Mail. Bitte prüfen Sie auch Ihren Spam‑Ordner.
          </Text>
        </div>

        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', margin: '0 0 8px' }}>Bestellübersicht</Text>
          <Text style={{ margin: '0 0 6px' }}>Bestellnummer: {order.display_id}</Text>
          <Text style={{ margin: '0 0 6px' }}>
            Bestelldatum: {new Date(order.created_at).toLocaleDateString('de-DE')}
          </Text>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#111827',
              color: '#ffffff',
              borderRadius: 8,
              padding: '12px 16px',
              marginTop: 8,
            }}
          >
            <Text style={{ margin: 0, fontWeight: 500 }}>Gesamtsumme</Text>
            <Text style={{ margin: 0, fontSize: 18, fontWeight: 'bold' }}>{totalText}</Text>
          </div>
        </div>

        <Hr style={{ margin: '20px 0' }} />

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }}>
          Lieferadresse
        </Text>
        <Text style={{ margin: '0 0 5px' }}>{shippingAddress.address_1}</Text>
        <Text style={{ margin: '0 0 5px' }}>
          {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal_code}
        </Text>
        <Text style={{ margin: '0 0 20px' }}>{shippingAddress.country_code}</Text>

        <Hr style={{ margin: '20px 0' }} />

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px' }}>
          Artikel
        </Text>

        <div
          style={{
            width: '100%',
            borderCollapse: 'collapse' as const,
            border: '1px solid #ddd',
            margin: '10px 0',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              backgroundColor: '#f2f2f2',
              padding: '8px 12px',
              borderBottom: '1px solid #ddd',
              fontWeight: 600,
            }}
          >
            <Text style={{ margin: 0 }}>Artikel</Text>
            <Text style={{ margin: 0 }}>Menge</Text>
            <Text style={{ margin: 0 }}>Preis</Text>
          </div>
          {order.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid #ddd',
              }}
            >
              <Text style={{ margin: 0 }}>{item.title} - {item.product_title}</Text>
              <Text style={{ margin: 0 }}>{item.quantity}</Text>
              <Text style={{ margin: 0 }}>{item.unit_price} {order.currency_code}</Text>
            </div>
          ))}
        </div>

        <Text style={{ marginTop: 24, color: '#6b7280' }}>
          Diese E‑Mail bestätigt Ihre Bestellung bei Art Of Gifts. Die Zahlungsanweisungen erhalten Sie separat. Bei Fragen antworten Sie einfach auf diese E‑Mail.
        </Text>
      </Section>
    </Base>
  )
}

OrderPlacedTemplate.PreviewProps = {
  order: {
    id: 'test-order-id',
    display_id: 'ORD-123',
    created_at: new Date().toISOString(),
    email: 'test@example.com',
    currency_code: 'EUR',
    items: [
      { id: 'item-1', title: 'Artikel 1', product_title: 'Produkt 1', quantity: 2, unit_price: 10 },
      { id: 'item-2', title: 'Artikel 2', product_title: 'Produkt 2', quantity: 1, unit_price: 25 }
    ],
    shipping_address: {
      first_name: 'Max',
      last_name: 'Mustermann',
      address_1: 'Musterstraße 1',
      city: 'Musterstadt',
      province: 'BY',
      postal_code: '12345',
      country_code: 'DE'
    },
    summary: { raw_current_order_total: { value: 45 } }
  },
  shippingAddress: {
    first_name: 'Max',
    last_name: 'Mustermann',
    address_1: 'Musterstraße 1',
    city: 'Musterstadt',
    province: 'BY',
    postal_code: '12345',
    country_code: 'DE'
  }
} as OrderPlacedPreviewProps

export default OrderPlacedTemplate
