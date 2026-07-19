import type { Money } from '../types'

export function formatMoney(value: Money | null | undefined): string {
  const n = Number(value ?? 0)
  return `Rs. ${n.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`
}

export function titleCase(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
