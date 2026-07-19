import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { formatMoney, titleCase } from '../lib/format'
import { useProfile } from '../hooks/useProfile'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageLoader,
  StatusBadge,
} from '../components/ui'
import type { ListResponse, MenuItem, OrderWithDetails } from '../types'

// Which next statuses a restaurant owner can move an order to, given its current status.
const NEXT_ACTIONS: Record<string, { status: string; label: string }[]> = {
  placed: [
    { status: 'accepted', label: 'Accept' },
    { status: 'cancelled', label: 'Reject' },
  ],
  accepted: [{ status: 'preparing', label: 'Start preparing' }],
  preparing: [{ status: 'out_for_delivery', label: 'Out for delivery' }],
}

function OrdersPanel({ restaurantId }: { restaurantId: number }) {
  const queryClient = useQueryClient()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['restaurant-orders', restaurantId],
    queryFn: async () =>
      (await api.get<{ data: OrderWithDetails[] }>(`/restaurants/${restaurantId}/orders`)).data
        .data,
    refetchInterval: 15000,
  })

  const mutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      api.patch(`/orders/${orderId}/status`, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurantId] }),
  })

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState message={apiErrorMessage(error, 'Could not load orders')} />
  if (!data || data.length === 0) return <EmptyState title="No orders yet" />

  return (
    <div className="space-y-3">
      {data.map((order) => {
        const actions = NEXT_ACTIONS[order.status ?? ''] ?? []
        return (
          <Card key={order.order_id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">
                  Order #{order.order_id}{' '}
                  <span className="font-normal text-neutral-500">
                    — {order.customers?.name ?? 'Customer'}
                  </span>
                </p>
                <p className="text-sm text-neutral-500">
                  {(order.order_items ?? []).reduce((n, i) => n + Number(i.quantity ?? 0), 0)} items
                  · {formatMoney(order.total_amount)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={order.status} />
                {actions.map((a) => (
                  <Button
                    key={a.status}
                    variant={a.status === 'cancelled' ? 'danger' : 'primary'}
                    onClick={() => mutation.mutate({ orderId: order.order_id, status: a.status })}
                    loading={mutation.isPending}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

function MenuPanel({ restaurantId }: { restaurantId: number }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [formError, setFormError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['owner-menu', restaurantId],
    queryFn: async () =>
      (
        await api.get<ListResponse<MenuItem>>('/menu-items', {
          params: { restaurant_id: restaurantId, pageSize: 100 },
        })
      ).data.data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['owner-menu', restaurantId] })

  const addItem = useMutation({
    mutationFn: () =>
      api.post('/menu-items', {
        restaurant_id: restaurantId,
        item_name: name,
        price: Number(price),
      }),
    onSuccess: () => {
      setName('')
      setPrice('')
      setFormError('')
      invalidate()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not add item')),
  })

  const toggle = useMutation({
    mutationFn: (item: MenuItem) =>
      api.patch(`/menu-items/${item.item_id}`, { availability: !(item.availability ?? true) }),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (itemId: number) => api.delete(`/menu-items/${itemId}`),
    onSuccess: invalidate,
  })

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-3 font-semibold">Add a menu item</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addItem.mutate()
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-40">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
          </div>
          <div className="w-32">
            <Field label="Price">
              <Input
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </Field>
          </div>
          <Button type="submit" loading={addItem.isPending}>
            Add
          </Button>
        </form>
        {formError && (
          <div className="mt-3">
            <ErrorState message={formError} />
          </div>
        )}
      </Card>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="space-y-2">
          {(data ?? []).map((item) => (
            <Card key={item.item_id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{item.item_name}</p>
                <p className="text-sm text-neutral-500">{formatMoney(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold ${
                    item.availability === false ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {item.availability === false ? 'Unavailable' : 'Available'}
                </span>
                <Button variant="secondary" onClick={() => toggle.mutate(item)}>
                  Toggle
                </Button>
                <Button variant="ghost" onClick={() => remove.mutate(item.item_id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function RestaurantDashboard() {
  const { data: profile, isLoading } = useProfile()
  const [tab, setTab] = useState<'orders' | 'menu'>('orders')

  if (isLoading) return <PageLoader />
  const restaurantId = profile?.restaurant?.restaurant_id
  if (!restaurantId) return <EmptyState title="No restaurant linked to this account" />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{profile?.restaurant?.name ?? 'Your restaurant'}</h1>
        <p className="text-sm text-neutral-500">Manage incoming orders and your menu</p>
      </div>

      <div className="mb-5 flex gap-2">
        {(['orders', 'menu'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === t ? 'bg-brand-600 text-white' : 'bg-neutral-200 text-neutral-700'
            }`}
          >
            {titleCase(t)}
          </button>
        ))}
      </div>

      {tab === 'orders' ? (
        <OrdersPanel restaurantId={restaurantId} />
      ) : (
        <MenuPanel restaurantId={restaurantId} />
      )}
    </div>
  )
}
