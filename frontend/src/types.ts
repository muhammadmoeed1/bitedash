export type Role = 'customer' | 'restaurant_owner' | 'delivery_agent' | 'admin'

export interface AuthUser {
  user_id: number
  email: string
  role: Role
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

/** Numeric money fields arrive from the API as strings (Prisma Decimal). */
export type Money = string | number

export interface ListMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ListResponse<T> {
  data: T[]
  meta: ListMeta
}

export interface ItemResponse<T> {
  data: T
}

export interface Restaurant {
  restaurant_id: number
  name: string | null
  email: string | null
  phone: string | null
  address: string | null
  owner_user_id: number | null
}

export interface MenuItem {
  item_id: number
  restaurant_id: number | null
  category_id: number | null
  item_name: string | null
  description: string | null
  price: Money | null
  availability: boolean | null
}

export interface FoodCategory {
  category_id: number
  category_name: string | null
}

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export interface Order {
  order_id: number
  customer_id: number | null
  order_date: string | null
  status: OrderStatus | string | null
  total_amount: Money | null
}

export interface OrderItem {
  order_item_id: number
  order_id: number | null
  item_id: number | null
  quantity: number | null
  price: Money | null
  menu_items?: MenuItem | null
}

export type DeliveryStatus = 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'

export interface Delivery {
  delivery_id: number
  order_id: number | null
  agent_id: number | null
  delivery_status: DeliveryStatus | string | null
  delivery_time: string | null
}

export interface Payment {
  payment_id: number
  order_id: number | null
  amount: Money | null
  payment_method: string | null
  payment_status: string | null
}

export interface Customer {
  customer_id: number
  name: string | null
  email: string | null
  phone: string | null
}

export interface OrderWithDetails extends Order {
  order_items?: OrderItem[]
  customers?: Customer | null
  payments?: Payment[]
  deliveries?: Delivery[]
}

// Real-time event payloads (must match backend/src/realtime/events.ts)
export interface OrderStatusEvent {
  order_id: number
  status: string
}
export interface DeliveryStatusEvent {
  delivery_id: number
  order_id: number | null
  status: string
}
export interface DeliveryLocationEvent {
  delivery_id: number
  order_id: number | null
  lat: number
  lng: number
  at: string
}
export interface PaymentStatusEvent {
  order_id: number | null
  payment_status: string
}
