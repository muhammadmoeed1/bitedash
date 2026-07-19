import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { AuthUser, Customer, Delivery, Restaurant } from '../types'

interface Profile extends AuthUser {
  customer: Customer | null
  restaurant: Restaurant | null
  delivery_agent: { agent_id: number; name: string | null } | null
  deliveries?: Delivery[]
}

/** Fetches the authenticated user's full profile (including their linked customer/restaurant/agent). */
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await api.get<{ data: Profile }>('/auth/me')).data.data,
  })
}
