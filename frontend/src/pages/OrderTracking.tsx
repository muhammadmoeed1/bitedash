import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { formatMoney, titleCase } from '../lib/format'
import { useAuth } from '../store/auth'
import { useOrderRealtime } from '../hooks/useOrderRealtime'
import { Button, Card, ErrorState, PageLoader, StatusBadge } from '../components/ui'
import type { Delivery, ItemResponse, ListResponse, Order, OrderItem } from '../types'

const LIFECYCLE = ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered'] as const

function Timeline({ status }: { status: string }) {
  if (status === 'cancelled') {
    return <p className="font-semibold text-red-600">This order was cancelled.</p>
  }
  const currentIndex = LIFECYCLE.indexOf(status as (typeof LIFECYCLE)[number])
  return (
    <ol className="flex flex-wrap gap-2">
      {LIFECYCLE.map((step, i) => {
        const done = i <= currentIndex
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                done ? 'bg-brand-600 text-white' : 'bg-neutral-200 text-neutral-500'
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-sm ${done ? 'font-semibold text-neutral-900' : 'text-neutral-400'}`}
            >
              {titleCase(step)}
            </span>
            {i < LIFECYCLE.length - 1 && <span className="text-neutral-300">→</span>}
          </li>
        )
      })}
    </ol>
  )
}

export function OrderTracking() {
  const { id } = useParams<{ id: string }>()
  const orderId = Number(id)
  const user = useAuth((s) => s.user)
  const queryClient = useQueryClient()
  const live = useOrderRealtime(orderId)
  const [payMessage, setPayMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => (await api.get<ItemResponse<Order>>(`/orders/${orderId}`)).data.data,
  })
  const itemsQuery = useQuery({
    queryKey: ['order-items', orderId],
    queryFn: async () =>
      (
        await api.get<ListResponse<OrderItem>>('/order-items', {
          params: { order_id: orderId, pageSize: 100 },
        })
      ).data.data,
  })
  const deliveryQuery = useQuery({
    queryKey: ['order-deliveries', orderId],
    queryFn: async () =>
      (
        await api.get<ListResponse<Delivery>>('/deliveries', {
          params: { order_id: orderId, pageSize: 10 },
        })
      ).data.data,
  })
  const itemIds = [
    ...new Set(
      (itemsQuery.data ?? [])
        .map((it) => it.item_id)
        .filter((id): id is number => id !== null),
    ),
  ]
  const menuItemsQuery = useQuery({
    queryKey: ['order-item-names', itemIds],
    queryFn: async () => {
      const results = await Promise.all(
        itemIds.map((itemId) =>
          api.get<ItemResponse<{ item_id: number; item_name: string }>>(`/menu-items/${itemId}`),
        ),
      )
      return new Map(results.map((res) => [res.data.data.item_id, res.data.data.item_name]))
    },
    enabled: itemIds.length > 0,
  })

  // When a live event arrives, refetch the authoritative records.
  useEffect(() => {
    if (live.orderStatus) queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    if (live.deliveryStatus)
      queryClient.invalidateQueries({ queryKey: ['order-deliveries', orderId] })
  }, [live.orderStatus, live.deliveryStatus, orderId, queryClient])

  if (orderQuery.isLoading) return <PageLoader />
  if (orderQuery.isError)
    return <ErrorState message={apiErrorMessage(orderQuery.error, 'Could not load order')} />

  const order = orderQuery.data!
  const status = live.orderStatus ?? order.status ?? 'placed'
  const delivery = deliveryQuery.data?.[0]
  const deliveryStatus = live.deliveryStatus ?? delivery?.delivery_status

  const pay = async () => {
    setPayMessage('')
    setBusy(true)
    try {
      const res = await api.post<{ data: { clientSecret: string | null } }>('/payments/intent', {
        order_id: orderId,
      })
      setPayMessage(
        res.data.data.clientSecret
          ? 'Payment intent created — a real frontend would now confirm the card via Stripe.js.'
          : 'Payment already completed.',
      )
    } catch (err) {
      setPayMessage(apiErrorMessage(err, 'Payment could not be started'))
    } finally {
      setBusy(false)
    }
  }

  const cancel = async () => {
    setActionError('')
    setBusy(true)
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'cancelled' })
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Could not cancel order'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order #{order.order_id}</h1>
        <span className="flex items-center gap-2 text-xs text-neutral-500">
          <span
            className={`h-2 w-2 rounded-full ${live.connected ? 'bg-green-500' : 'bg-neutral-300'}`}
          />
          {live.connected ? 'Live' : 'Offline'}
        </span>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <span className="font-semibold">Status</span>
          <StatusBadge status={status} />
        </div>
        <Timeline status={status} />
      </Card>

      {delivery && (
        <Card>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Delivery</span>
            <StatusBadge status={deliveryStatus} />
          </div>
          {live.location && (
            <p className="mt-2 text-sm text-neutral-600">
              Live location: {live.location.lat.toFixed(4)}, {live.location.lng.toFixed(4)}{' '}
              <span className="text-neutral-400">
                ({new Date(live.location.at).toLocaleTimeString()})
              </span>
            </p>
          )}
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-semibold">Items</h2>
        <ul className="divide-y divide-neutral-100">
          {(itemsQuery.data ?? []).map((it) => (
            <li key={it.order_item_id} className="flex justify-between py-2 text-sm">
              <span>
                {it.quantity} ×{' '}
                {(it.item_id !== null && menuItemsQuery.data?.get(it.item_id)) ||
                  `item #${it.item_id}`}
              </span>
              <span className="font-medium">
                {formatMoney(Number(it.price) * Number(it.quantity))}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-neutral-200 pt-3">
          <span className="font-semibold">Total</span>
          <span className="text-xl font-bold text-brand-700">
            {formatMoney(order.total_amount)}
          </span>
        </div>
      </Card>

      {user?.role === 'customer' && (
        <Card>
          <h2 className="mb-3 font-semibold">Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={pay} loading={busy} disabled={status === 'cancelled'}>
              Pay now
            </Button>
            {status === 'placed' && (
              <Button variant="danger" onClick={cancel} loading={busy}>
                Cancel order
              </Button>
            )}
          </div>
          {payMessage && <p className="mt-3 text-sm text-neutral-600">{payMessage}</p>}
          {actionError && (
            <div className="mt-3">
              <ErrorState message={actionError} />
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
