import { Link } from 'react-router-dom'
import { useCart } from '../store/cart'
import { formatMoney } from '../lib/format'
import { Button, Card, EmptyState } from '../components/ui'

export function Cart() {
  const { lines, setQuantity, remove, clear, totalPrice } = useCart()

  if (lines.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Your Cart</h1>
        <EmptyState title="Your cart is empty" hint="Browse restaurants and add some items." />
        <div className="mt-4 text-center">
          <Link to="/restaurants">
            <Button>Browse restaurants</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Cart</h1>
        <Button variant="ghost" onClick={clear}>
          Clear cart
        </Button>
      </div>

      <div className="space-y-3">
        {lines.map((line) => (
          <Card key={line.item_id} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-neutral-900">{line.item_name}</p>
              <p className="text-sm text-neutral-500">{formatMoney(line.price)} each</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  className="h-8 w-8 rounded-lg border border-neutral-300 font-bold hover:bg-neutral-100"
                  onClick={() => setQuantity(line.item_id, line.quantity - 1)}
                >
                  −
                </button>
                <span className="w-6 text-center font-medium">{line.quantity}</span>
                <button
                  className="h-8 w-8 rounded-lg border border-neutral-300 font-bold hover:bg-neutral-100"
                  onClick={() => setQuantity(line.item_id, line.quantity + 1)}
                >
                  +
                </button>
              </div>
              <p className="w-24 text-right font-bold text-brand-700">
                {formatMoney(line.price * line.quantity)}
              </p>
              <button
                className="text-sm text-neutral-400 hover:text-red-600"
                onClick={() => remove(line.item_id)}
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold text-brand-700">{formatMoney(totalPrice())}</span>
        </div>
        <Link to="/checkout">
          <Button className="mt-4 w-full">Proceed to checkout</Button>
        </Link>
      </Card>
    </div>
  )
}
