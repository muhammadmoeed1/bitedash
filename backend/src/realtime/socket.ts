import type { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { verifyAccessToken } from '../auth/jwt';
import { Actor } from '../core/types';
import { emitDeliveryLocation, orderRoom, setIo } from './events';
import { canAccessOrder, resolveDeliveryForLocation } from './order-access';

interface AuthedSocket extends Socket {
  actor?: Actor;
}

/**
 * Attaches a Socket.IO server to the existing HTTP server. Clients authenticate with a JWT
 * access token (handshake `auth.token`), then subscribe to specific orders they're allowed
 * to watch. Delivery agents can additionally stream live location into an order's room.
 */
export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',') },
  });

  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Missing auth token'));
    try {
      const payload = verifyAccessToken(token);
      socket.actor = { userId: payload.sub, role: payload.role };
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthedSocket) => {
    const actor = socket.actor!;
    logger.debug({ userId: actor.userId, role: actor.role }, 'socket connected');

    // Subscribe to an order's live channel (status, delivery status, location, payment).
    socket.on('subscribe:order', async (rawOrderId: unknown, ack?: (res: unknown) => void) => {
      const orderId = Number(rawOrderId);
      if (!Number.isInteger(orderId) || orderId <= 0) {
        ack?.({ ok: false, error: 'Invalid order id' });
        return;
      }
      if (!(await canAccessOrder(actor, orderId))) {
        ack?.({ ok: false, error: 'Forbidden' });
        return;
      }
      await socket.join(orderRoom(orderId));
      ack?.({ ok: true });
    });

    socket.on('unsubscribe:order', async (rawOrderId: unknown) => {
      const orderId = Number(rawOrderId);
      if (Number.isInteger(orderId) && orderId > 0) await socket.leave(orderRoom(orderId));
    });

    // Delivery agent streams live GPS for a delivery; server re-broadcasts to that order's room.
    socket.on('delivery:location', async (payload: unknown, ack?: (res: unknown) => void) => {
      const { delivery_id, lat, lng } = (payload ?? {}) as Record<string, unknown>;
      const deliveryId = Number(delivery_id);
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (!Number.isInteger(deliveryId) || Number.isNaN(latNum) || Number.isNaN(lngNum)) {
        ack?.({ ok: false, error: 'Invalid location payload' });
        return;
      }
      const resolved = await resolveDeliveryForLocation(actor, deliveryId);
      if (!resolved) {
        ack?.({ ok: false, error: 'Forbidden' });
        return;
      }
      emitDeliveryLocation({
        delivery_id: deliveryId,
        order_id: resolved.orderId,
        lat: latNum,
        lng: lngNum,
        at: new Date().toISOString(),
      });
      ack?.({ ok: true });
    });
  });

  setIo(io);
  logger.info('Real-time server (Socket.IO) attached');
  return io;
}
