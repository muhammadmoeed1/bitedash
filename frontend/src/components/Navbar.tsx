import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useCart } from '../store/cart'
import { Button } from './ui'
import type { Role } from '../types'

const NAV_BY_ROLE: Record<Role, { to: string; label: string }[]> = {
  customer: [
    { to: '/restaurants', label: 'Restaurants' },
    { to: '/orders', label: 'My Orders' },
  ],
  restaurant_owner: [{ to: '/dashboard/restaurant', label: 'Restaurant Dashboard' }],
  delivery_agent: [{ to: '/dashboard/deliveries', label: 'My Deliveries' }],
  admin: [
    { to: '/restaurants', label: 'Restaurants' },
    { to: '/dashboard/admin', label: 'Admin' },
  ],
}

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const totalItems = useCart((s) => s.totalItems())

  const links = user ? NAV_BY_ROLE[user.role] : []

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-brand-600">
          <span aria-hidden>🍔</span> BiteDash
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-neutral-600 hover:bg-neutral-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          {user?.role === 'customer' && (
            <NavLink
              to="/cart"
              className="relative rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Cart
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
                  {totalItems}
                </span>
              )}
            </NavLink>
          )}

          {user ? (
            <div className="ml-2 flex items-center gap-2">
              <span className="hidden text-sm text-neutral-500 sm:inline">{user.email}</span>
              <Button variant="secondary" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Sign up</Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
