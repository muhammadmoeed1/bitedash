import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { formatMoney } from '../lib/format'
import { useAuth } from '../store/auth'
import { useCart } from '../store/cart'
import { Button, Card, EmptyState, ErrorState, PageLoader } from '../components/ui'
import type { ItemResponse, ListResponse, MenuItem, Restaurant } from '../types'

export function RestaurantMenu() {
  const { id } = useParams<{ id: string }>()
  const restaurantId = Number(id)
  const user = useAuth((s) => s.user)
  const add = useCart((s) => s.add)
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null)

  const restaurantQuery = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => (await api.get<ItemResponse<Restaurant>>(`/restaurants/${restaurantId}`)).data.data,
  })

  const menuQuery = useQuery({
    queryKey: ['menu-items', restaurantId],
    queryFn: async () =>
      (await api.get<ListResponse<MenuItem>>('/menu-items', { params: { restaurant_id: restaurantId, pageSize: 100 } }))
        .data.data,
  })

  const handleAdd = (item: MenuItem) => {
    const result = add(item)
    setToast(result.ok ? { text: `Added ${item.item_name}`, ok: true } : { text: result.error!, ok: false })
    setTimeout(() => setToast(null), 2500)
  }

  if (restaurantQuery.isLoading || menuQuery.isLoading) return <PageLoader />
  if (restaurantQuery.isError)
    return <ErrorState message={apiErrorMessage(restaurantQuery.error, 'Could not load restaurant')} />

  const restaurant = restaurantQuery.data
  const items = menuQuery.data ?? []

  return (
    <div>
      {toast && (
        <div
          className={`fixed left-1/2 top-20 z-20 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg ${
            toast.ok ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{restaurant?.name}</h1>
        {restaurant?.address && <p className="text-sm text-neutral-500">{restaurant.address}</p>}
      </div>

      {items.length === 0 ? (
        <EmptyState title="No menu items yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <Card key={item.item_id} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-semibold text-neutral-900">{item.item_name}</h3>
                {item.description && <p className="mt-1 text-sm text-neutral-500">{item.description}</p>}
                <p className="mt-2 font-bold text-brand-700">{formatMoney(item.price)}</p>
                {item.availability === false && (
                  <p className="mt-1 text-xs font-semibold text-red-600">Currently unavailable</p>
                )}
              </div>
              {user?.role === 'customer' && (
                <Button onClick={() => handleAdd(item)} disabled={item.availability === false}>
                  Add
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
