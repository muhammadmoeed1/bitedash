import type { Server } from 'socket.io';
import { logger } from '../lib/logger';

/**
 * Thin real-time event layer. Services import ONLY from here (never from socket.ts or
 * socket.io directly), so business logic stays decoupled from the transport and the whole
 * feature degrades to no-ops if the socket server was never started.
 */
let io: Server | null = null;

export function setIo(server: Server): void {
  io = server;
}

export const orderRoom = (orderId: number) => `order:${orderId}`;

export interface OrderStatusEvent {
  order_id: number;
  status: string;
}

export interface DeliveryStatusEvent {
  delivery_id: number;
  order_id: number | null;
  status: string;
}

export interface DeliveryLocationEvent {
  delivery_id: number;
  order_id: number | null;
  lat: number;
  lng: number;
  at: string;
}

export interface PaymentStatusEvent {
  order_id: number | null;
  payment_status: string;
}

function emit(room: string, event: string, payload: unknown): void {
  if (!io) return; // real-time not enabled — services keep working, just no live push
  io.to(room).emit(event, payload);
  logger.debug({ room, event }, 'emitted realtime event');
}

export function emitOrderStatus(e: OrderStatusEvent): void {
  emit(orderRoom(e.order_id), 'order:status', e);
}

export function emitDeliveryStatus(e: DeliveryStatusEvent): void {
  if (e.order_id != null) emit(orderRoom(e.order_id), 'delivery:status', e);
}

export function emitDeliveryLocation(e: DeliveryLocationEvent): void {
  if (e.order_id != null) emit(orderRoom(e.order_id), 'delivery:location', e);
}

export function emitPaymentStatus(e: PaymentStatusEvent): void {
  if (e.order_id != null) emit(orderRoom(e.order_id), 'payment:status', e);
}
