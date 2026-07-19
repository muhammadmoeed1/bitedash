import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { apiErrorMessage } from '../lib/api'
import { Button, Card, ErrorState, Field, Input, Select } from '../components/ui'

type RegRole = 'customer' | 'restaurant_owner' | 'delivery_agent'

export function Register() {
  const register = useAuth((s) => s.register)
  const navigate = useNavigate()

  const [role, setRole] = useState<RegRole>('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [address, setAddress] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const base = { role, email, password }
      const payload =
        role === 'customer'
          ? { ...base, name, phone: phone || undefined }
          : role === 'restaurant_owner'
            ? { ...base, restaurant_name: restaurantName, phone: phone || undefined, address: address || undefined }
            : { ...base, name, phone, vehicle_number: vehicleNumber || undefined }
      await register(payload)
      navigate('/', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-center text-2xl font-bold">Create your account</h1>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          {error && <ErrorState message={error} />}
          <Field label="I am a...">
            <Select value={role} onChange={(e) => setRole(e.target.value as RegRole)}>
              <option value="customer">Customer</option>
              <option value="restaurant_owner">Restaurant owner</option>
              <option value="delivery_agent">Delivery agent</option>
            </Select>
          </Field>

          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Password (min 8 characters)">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </Field>

          {role === 'restaurant_owner' ? (
            <>
              <Field label="Restaurant name">
                <Input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} required />
              </Field>
              <Field label="Address">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </Field>
              <Field label="Phone">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Full name">
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label="Phone">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required={role === 'delivery_agent'}
                />
              </Field>
              {role === 'delivery_agent' && (
                <Field label="Vehicle number">
                  <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
                </Field>
              )}
            </>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Create account
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-neutral-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
