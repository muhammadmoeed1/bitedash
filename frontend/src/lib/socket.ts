import { io, type Socket } from 'socket.io-client'
import { tokens } from './tokens'

const baseURL = import.meta.env.VITE_API_URL ?? ''

let socket: Socket | null = null

/** Lazily creates the shared Socket.IO connection, authenticated with the current access token. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(baseURL || undefined, {
      auth: { token: tokens.getAccess() },
      autoConnect: true,
      transports: ['websocket'],
    })
  }
  return socket
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}
