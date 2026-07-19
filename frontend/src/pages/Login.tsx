import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { apiErrorMessage } from '../lib/api'
import { Button, Card, ErrorState, Field, Input } from '../components/ui'

const DEMO_ACCOUNTS = [
  { label: 'Customer', email: 'ali.raza@example.com' },
  { label: 'Restaurant', email: 'orders@sweettreats.com' },
  { label: 'Delivery', email: 'fahad.iqbal.rider@example.com' },
  { label: 'Admin', email: 'admin@bitedash.com' },
]

export function Login() {
  const login = useAuth((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  const useDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('Password123!')
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-center text-2xl font-bold">Welcome back</h1>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          {error && <ErrorState message={error} />}
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <Button type="submit" loading={loading} className="w-full">
            Log in
          </Button>
        </form>

        <div className="mt-6 border-t border-neutral-200 pt-4">
          <p className="mb-2 text-center text-xs font-medium text-neutral-500">
            Try a demo account (password auto-fills)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => useDemo(acc.email)}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:border-brand-400 hover:text-brand-700"
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <p className="mt-4 text-center text-sm text-neutral-600">
        No account?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
