import { beforeEach, describe, expect, it } from 'vitest'
import { useCart } from './cart'
import type { MenuItem } from '../types'

function item(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    item_id: 1,
    restaurant_id: 1,
    category_id: null,
    item_name: 'Burger',
    description: null,
    price: 500,
    availability: true,
    ...overrides,
  }
}

beforeEach(() => {
  useCart.setState({ lines: [], restaurantId: null })
})

describe('cart store', () => {
  it('adds a new item as a new line', () => {
    const result = useCart.getState().add(item())
    expect(result.ok).toBe(true)
    expect(useCart.getState().lines).toHaveLength(1)
    expect(useCart.getState().lines[0].quantity).toBe(1)
    expect(useCart.getState().restaurantId).toBe(1)
  })

  it('increments quantity when the same item is added again', () => {
    const cart = useCart.getState()
    cart.add(item())
    cart.add(item())
    expect(useCart.getState().lines).toHaveLength(1)
    expect(useCart.getState().lines[0].quantity).toBe(2)
  })

  it('rejects adding an item from a different restaurant than what is already in the cart', () => {
    useCart.getState().add(item({ item_id: 1, restaurant_id: 1 }))
    const result = useCart.getState().add(item({ item_id: 2, restaurant_id: 2 }))
    expect(result.ok).toBe(false)
    expect(useCart.getState().lines).toHaveLength(1)
  })

  it('rejects an item missing required fields', () => {
    const result = useCart.getState().add(item({ price: null }))
    expect(result.ok).toBe(false)
    expect(useCart.getState().lines).toHaveLength(0)
  })

  it('setQuantity updates the line quantity', () => {
    useCart.getState().add(item())
    useCart.getState().setQuantity(1, 5)
    expect(useCart.getState().lines[0].quantity).toBe(5)
  })

  it('setQuantity to zero removes the line and clears restaurantId', () => {
    useCart.getState().add(item())
    useCart.getState().setQuantity(1, 0)
    expect(useCart.getState().lines).toHaveLength(0)
    expect(useCart.getState().restaurantId).toBeNull()
  })

  it('remove drops the line and, once empty, clears restaurantId so a new restaurant can be chosen', () => {
    useCart.getState().add(item())
    useCart.getState().remove(1)
    expect(useCart.getState().lines).toHaveLength(0)
    expect(useCart.getState().restaurantId).toBeNull()

    // With the cart now empty, a different restaurant's item should be accepted.
    const result = useCart.getState().add(item({ item_id: 2, restaurant_id: 2 }))
    expect(result.ok).toBe(true)
  })

  it('computes totalItems and totalPrice across multiple lines', () => {
    useCart.getState().add(item({ item_id: 1, price: 500 }))
    useCart.getState().add(item({ item_id: 2, price: 300 }))
    useCart.getState().setQuantity(2, 3)
    expect(useCart.getState().totalItems()).toBe(4) // 1 + 3
    expect(useCart.getState().totalPrice()).toBe(500 * 1 + 300 * 3)
  })

  it('clear empties the cart entirely', () => {
    useCart.getState().add(item())
    useCart.getState().clear()
    expect(useCart.getState().lines).toHaveLength(0)
    expect(useCart.getState().restaurantId).toBeNull()
  })
})
