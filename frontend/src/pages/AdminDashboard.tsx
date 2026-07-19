import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, apiErrorMessage } from '../lib/api'
import { formatMoney, titleCase } from '../lib/format'
import { Card, ErrorState, PageLoader } from '../components/ui'
import type { ListResponse, Order, Payment } from '../types'

// Validated categorical palette (dataviz skill, first 4 slots — passes all-pairs CVD in light).
const PIE_COLORS = ['#2a78d6', '#008300', '#e87ba4', '#eda100']
const BAR_COLOR = '#ea580c'

async function countOf(path: string): Promise<number> {
  const res = await api.get<ListResponse<unknown>>(path, { params: { pageSize: 1 } })
  return res.data.meta.total
}

function groupByStatus<T>(rows: T[], key: keyof T) {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const status = String(row[key] ?? 'unknown')
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }
  return [...counts.entries()].map(([status, count]) => ({ status: titleCase(status), count }))
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-neutral-900">{value}</p>
    </Card>
  )
}

export function AdminDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const [customers, restaurants, menuItems, ordersRes, paymentsRes] = await Promise.all([
        countOf('/customers'),
        countOf('/restaurants'),
        countOf('/menu-items'),
        api.get<ListResponse<Order>>('/orders', { params: { pageSize: 100 } }),
        api.get<ListResponse<Payment>>('/payments', { params: { pageSize: 100 } }),
      ])
      const orders = ordersRes.data.data
      const payments = paymentsRes.data.data
      const revenue = payments
        .filter((p) => p.payment_status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
      return {
        customers,
        restaurants,
        menuItems,
        totalOrders: ordersRes.data.meta.total,
        revenue,
        ordersByStatus: groupByStatus(orders, 'status'),
        paymentsByStatus: groupByStatus(payments, 'payment_status'),
      }
    },
  })

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState message={apiErrorMessage(error, 'Could not load analytics')} />
  if (!data) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-neutral-500">Platform overview (computed live from the database)</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile label="Customers" value={data.customers} />
        <StatTile label="Restaurants" value={data.restaurants} />
        <StatTile label="Menu items" value={data.menuItems} />
        <StatTile label="Orders" value={data.totalOrders} />
        <StatTile label="Revenue" value={formatMoney(data.revenue)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Orders by status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.ordersByStatus} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <XAxis dataKey="status" tick={{ fontSize: 12 }} stroke="#a3a3a3" interval={0} angle={-15} dy={8} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#a3a3a3" />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="count" name="Orders" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Payments by status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.paymentsByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(entry) => {
                  const e = entry as unknown as { status?: string; count?: number }
                  return `${e.status ?? ''}: ${e.count ?? 0}`
                }}
              >
                {data.paymentsByStatus.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
