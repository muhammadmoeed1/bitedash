import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from './store/auth'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PageLoader } from './components/ui'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Restaurants } from './pages/Restaurants'
import { RestaurantMenu } from './pages/RestaurantMenu'
import { Cart } from './pages/Cart'
import { Checkout } from './pages/Checkout'
import { Orders } from './pages/Orders'
import { OrderTracking } from './pages/OrderTracking'
import { RestaurantDashboard } from './pages/RestaurantDashboard'
import { DeliveryDashboard } from './pages/DeliveryDashboard'
import { NotFound } from './pages/NotFound'

// Lazy-loaded so the charting library (recharts) is split into its own chunk and only
// downloaded when an admin actually opens the analytics dashboard.
const AdminDashboard = lazy(() =>
  import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
)

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

export default function App() {
  const loadCurrentUser = useAuth((s) => s.loadCurrentUser)

  useEffect(() => {
    loadCurrentUser()
  }, [loadCurrentUser])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/restaurants/:id" element={<RestaurantMenu />} />

            <Route
              path="/cart"
              element={
                <ProtectedRoute roles={['customer']}>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute roles={['customer']}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute roles={['customer', 'admin']}>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderTracking />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/restaurant"
              element={
                <ProtectedRoute roles={['restaurant_owner', 'admin']}>
                  <RestaurantDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/deliveries"
              element={
                <ProtectedRoute roles={['delivery_agent', 'admin']}>
                  <DeliveryDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Suspense fallback={<PageLoader />}>
                    <AdminDashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
