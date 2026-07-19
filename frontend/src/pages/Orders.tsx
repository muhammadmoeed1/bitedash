import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { formatMoney } from '../lib/format'
import { Card, EmptyState, ErrorState, PageLoader, StatusBadge } from '../components/ui'
import type { ListResponse, Order } from '../types'

export function Orders() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['orders'],
    queryFn: async () =>
      (
        await api.get<ListResponse<Order>>('/orders', {
          params: { pageSize: 50, sort: 'order_id:desc' },
        })
      ).data,
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>

      {isLoading && <PageLoader />}
      {isError && <ErrorState message={apiErrorMessage(error, 'Could not load orders')} />}
      {data && data.data.length === 0 && (
        <EmptyState title="No orders yet" hint="Place your first order from a restaurant." />
      )}

      {data && data.data.length > 0 && (
        <div className="space-y-3">
          {data.data.map((order) => (
            <Link key={order.order_id} to={`/orders/${order.order_id}`}>
              <Card className="flex items-center justify-between transition hover:border-brand-400 hover:shadow-md">
                <div>
                  <p className="font-semibold">Order #{order.order_id}</p>
                  <p className="text-sm text-neutral-500">{order.order_date?.slice(0, 10)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-brand-700">
                    {formatMoney(order.total_amount)}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
