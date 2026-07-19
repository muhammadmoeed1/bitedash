import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { formatMoney } from '../lib/format'
import { useCart } from '../store/cart'
import { Button, Card, EmptyState, ErrorState } from '../components/ui'
import type { ItemResponse, Order } from '../types'

export function Checkout() {
  const { lines, totalPrice, clear } = useCart()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (lines.length === 0) {
    return <EmptyState title="Nothing to check out" hint="Your cart is empty." />
  }

  const placeOrder = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.post<ItemResponse<Order>>('/orders/checkout', {
        items: lines.map((l) => ({ item_id: l.item_id, quantity: l.quantity })),
      })
      clear()
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      navigate(`/orders/${res.data.data.order_id}`)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not place order'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      <Card>
        <h2 className="mb-3 font-semibold">Order summary</h2>
        <ul className="divide-y divide-neutral-100">
          {lines.map((l) => (
            <li key={l.item_id} className="flex justify-between py-2 text-sm">
              <span>
                {l.quantity} × {l.item_name}
              </span>
              <span className="font-medium">{formatMoney(l.price * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-neutral-200 pt-3">
          <span className="font-semibold">Total</span>
          <span className="text-xl font-bold text-brand-700">{formatMoney(totalPrice())}</span>
        </div>

        {error && <div className="mt-4"><ErrorState message={error} /></div>}

        <Button onClick={placeOrder} loading={loading} className="mt-5 w-full">
          Place order
        </Button>
        <p className="mt-2 text-center text-xs text-neutral-500">
          You can pay for the order from its tracking page.
        </p>
      </Card>
    </div>
  )
}
