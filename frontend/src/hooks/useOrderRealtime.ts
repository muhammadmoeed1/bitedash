import { useEffect, useState } from 'react'
import { getSocket } from '../lib/socket'
import type {
  DeliveryLocationEvent,
  DeliveryStatusEvent,
  OrderStatusEvent,
  PaymentStatusEvent,
} from '../types'

export interface OrderRealtimeState {
  orderStatus?: string
  deliveryStatus?: string
  paymentStatus?: string
  location?: DeliveryLocationEvent
  connected: boolean
}

/**
 * Subscribes to an order's real-time room and returns the latest live status/location.
 * Cleans up its listeners and leaves the room on unmount.
 */
export function useOrderRealtime(orderId: number | null): OrderRealtimeState {
  const [state, setState] = useState<OrderRealtimeState>({ connected: false })

  useEffect(() => {
    if (!orderId) return
    const socket = getSocket()

    const onConnect = () => {
      setState((s) => ({ ...s, connected: true }))
      socket.emit('subscribe:order', orderId)
    }
    const onDisconnect = () => setState((s) => ({ ...s, connected: false }))
    const onOrderStatus = (e: OrderStatusEvent) =>
      e.order_id === orderId && setState((s) => ({ ...s, orderStatus: e.status }))
    const onDeliveryStatus = (e: DeliveryStatusEvent) =>
      e.order_id === orderId && setState((s) => ({ ...s, deliveryStatus: e.status }))
    const onPaymentStatus = (e: PaymentStatusEvent) =>
      e.order_id === orderId && setState((s) => ({ ...s, paymentStatus: e.payment_status }))
    const onLocation = (e: DeliveryLocationEvent) =>
      e.order_id === orderId && setState((s) => ({ ...s, location: e }))

    if (socket.connected) onConnect()
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('order:status', onOrderStatus)
    socket.on('delivery:status', onDeliveryStatus)
    socket.on('payment:status', onPaymentStatus)
    socket.on('delivery:location', onLocation)

    return () => {
      socket.emit('unsubscribe:order', orderId)
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('order:status', onOrderStatus)
      socket.off('delivery:status', onDeliveryStatus)
      socket.off('payment:status', onPaymentStatus)
      socket.off('delivery:location', onLocation)
    }
  }, [orderId])

  return state
}
