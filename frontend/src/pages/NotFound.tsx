import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <p className="mt-2 text-lg text-neutral-600">This page could not be found.</p>
      <Link to="/" className="mt-6 inline-block">
        <Button>Back home</Button>
      </Link>
    </div>
  )
}
