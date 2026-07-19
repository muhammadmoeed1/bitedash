import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { Button } from '../components/ui'

const ROLE_HOME: Record<string, string> = {
  restaurant_owner: '/dashboard/restaurant',
  delivery_agent: '/dashboard/deliveries',
  admin: '/dashboard/admin',
}

export function Home() {
  const { user, initializing } = useAuth()

  if (!initializing && user) {
    return <Navigate to={ROLE_HOME[user.role] ?? '/restaurants'} replace />
  }

  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <div className="mb-4 text-6xl">🍔</div>
      <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900">
        Delicious food, <span className="text-brand-600">delivered fast</span>
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-lg text-neutral-600">
        Browse restaurants, order in a couple of taps, and track your delivery live from the kitchen to your door.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/register">
          <Button className="px-6 py-3 text-base">Get started</Button>
        </Link>
        <Link to="/login">
          <Button variant="secondary" className="px-6 py-3 text-base">
            Log in
          </Button>
        </Link>
      </div>
    </div>
  )
}
