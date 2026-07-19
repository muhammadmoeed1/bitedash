import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { Card, EmptyState, ErrorState, Input, PageLoader } from '../components/ui'
import type { ListResponse, Restaurant } from '../types'

export function Restaurants() {
  const [search, setSearch] = useState('')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['restaurants', search],
    queryFn: async () => {
      const res = await api.get<ListResponse<Restaurant>>('/restaurants', {
        params: { pageSize: 50, ...(search ? { search } : {}) },
      })
      return res.data
    },
  })

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Restaurants</h1>
          <p className="text-sm text-neutral-500">Browse places near you and order in</p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search restaurants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading && <PageLoader />}
      {isError && <ErrorState message={apiErrorMessage(error, 'Could not load restaurants')} />}

      {data && data.data.length === 0 && (
        <EmptyState title="No restaurants found" hint="Try a different search." />
      )}

      {data && data.data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((r) => (
            <Link key={r.restaurant_id} to={`/restaurants/${r.restaurant_id}`}>
              <Card className="h-full transition hover:border-brand-400 hover:shadow-md">
                <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-brand-100 to-brand-300 text-4xl">
                  🍽️
                </div>
                <h2 className="font-semibold text-neutral-900">{r.name}</h2>
                {r.address && <p className="mt-1 text-sm text-neutral-500">{r.address}</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
