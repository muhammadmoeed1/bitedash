import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MenuItem } from '../types'

export interface CartLine {
  item_id: number
  item_name: string
  price: number
  restaurant_id: number
  quantity: number
}

interface CartState {
  lines: CartLine[]
  /** The restaurant the current cart belongs to (an order can only span one restaurant). */
  restaurantId: number | null
  add: (item: MenuItem) => { ok: boolean; error?: string }
  setQuantity: (itemId: number, quantity: number) => void
  remove: (itemId: number) => void
  clear: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      restaurantId: null,

      add: (item) => {
        if (item.restaurant_id == null || item.item_name == null || item.price == null) {
          return { ok: false, error: 'This item cannot be ordered' }
        }
        const state = get()
        // Enforce the backend's single-restaurant-per-order rule at the cart level.
        if (state.restaurantId !== null && state.restaurantId !== item.restaurant_id) {
          return {
            ok: false,
            error: 'Your cart has items from another restaurant. Clear it to order from here.',
          }
        }
        const existing = state.lines.find((l) => l.item_id === item.item_id)
        if (existing) {
          set({
            lines: state.lines.map((l) =>
              l.item_id === item.item_id ? { ...l, quantity: l.quantity + 1 } : l,
            ),
          })
        } else {
          set({
            restaurantId: item.restaurant_id,
            lines: [
              ...state.lines,
              {
                item_id: item.item_id,
                item_name: item.item_name,
                price: Number(item.price),
                restaurant_id: item.restaurant_id,
                quantity: 1,
              },
            ],
          })
        }
        return { ok: true }
      },

      setQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().remove(itemId)
          return
        }
        set({ lines: get().lines.map((l) => (l.item_id === itemId ? { ...l, quantity } : l)) })
      },

      remove: (itemId) => {
        const lines = get().lines.filter((l) => l.item_id !== itemId)
        set({ lines, restaurantId: lines.length ? get().restaurantId : null })
      },

      clear: () => set({ lines: [], restaurantId: null }),

      totalItems: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
      totalPrice: () => get().lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    }),
    { name: 'bitedash.cart' },
  ),
)
