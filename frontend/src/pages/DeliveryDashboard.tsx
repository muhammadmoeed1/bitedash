import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { getSocket } from '../lib/socket'
import { useProfile } from '../hooks/useProfile'
import { Button, Card, EmptyState, ErrorState, PageLoader, StatusBadge } from '../components/ui'
import type { Delivery, ListResponse } from '../types'

const NEXT_DELIVERY: Record<string, { status: string; label: string }[]> = {
  assigned: [
    { status: 'picked_up', label: 'Mark picked up' },
    { status: 'failed', label: 'Mark failed' },
  ],
  picked_up: [
    { status: 'in_transit', label: 'Start transit' },
    { status: 'failed', label: 'Mark failed' },
  ],
  in_transit: [
    { status: 'delivered', label: 'Mark delivered' },
    { status: 'failed', label: 'Mark failed' },
  ],
}

export function DeliveryDashboard() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const queryClient = useQueryClient()
  const agentId = profile?.delivery_agent?.agent_id

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['agent-deliveries', agentId],
    queryFn: async () =>
      (
        await api.get<ListResponse<Delivery>>('/deliveries', {
          params: { agent_id: agentId, pageSize: 100 },
        })
      ).data.data,
    enabled: !!agentId,
    refetchInterval: 15000,
  })

  const setStatus = useMutation({
    mutationFn: ({ deliveryId, status }: { deliveryId: number; status: string }) =>
      api.patch(`/deliveries/${deliveryId}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-deliveries', agentId] }),
  })

  // Simulate a live GPS ping over the socket — the customer watching sees it in real time.
  // (react-hooks/purity flags Math.random here on the assumption this project uses the React
  // Compiler, which it doesn't — this handler only ever runs from the onClick below, never
  // during render, so the randomness is safe.)
  /* eslint-disable react-hooks/purity */
  const pingLocation = (delivery: Delivery) => {
    const socket = getSocket()
    socket.emit('delivery:location', {
      delivery_id: delivery.delivery_id,
      lat: 31.5 + Math.random() * 0.1,
      lng: 74.3 + Math.random() * 0.1,
    })
  }
  /* eslint-enable react-hooks/purity */

  if (profileLoading) return <PageLoader />
  if (!agentId) return <EmptyState title="No delivery-agent profile linked to this account" />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Deliveries</h1>
        <p className="text-sm text-neutral-500">{profile?.delivery_agent?.name}</p>
      </div>

      {isLoading && <PageLoader />}
      {isError && <ErrorState message={apiErrorMessage(error, 'Could not load deliveries')} />}
      {data && data.length === 0 && <EmptyState title="No deliveries assigned yet" />}

      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((d) => {
            const actions = NEXT_DELIVERY[d.delivery_status ?? ''] ?? []
            const active = d.delivery_status === 'picked_up' || d.delivery_status === 'in_transit'
            return (
              <Card key={d.delivery_id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Delivery #{d.delivery_id}</p>
                    <p className="text-sm text-neutral-500">Order #{d.order_id}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={d.delivery_status} />
                    {active && (
                      <Button variant="secondary" onClick={() => pingLocation(d)}>
                        Send location
                      </Button>
                    )}
                    {actions.map((a) => (
                      <Button
                        key={a.status}
                        variant={a.status === 'failed' ? 'danger' : 'primary'}
                        onClick={() =>
                          setStatus.mutate({ deliveryId: d.delivery_id, status: a.status })
                        }
                        loading={setStatus.isPending}
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
      )}
    </div>
  )
}
