import { test, expect } from '@playwright/test'

const PASSWORD = 'Password123!'
const CUSTOMER_EMAIL = 'ali.raza@example.com'

// Exercises the full customer journey against the real backend + database (seeded via
// `npm run seed`): browse -> login -> add to cart -> checkout -> place order -> live tracking.
// Neon's serverless Postgres can cold-start on the first query after idle, so this waits on
// real navigation/content rather than fixed delays.
test('customer can browse, order, and track a delivery end-to-end', async ({ page }) => {
  test.setTimeout(60000)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: /delicious food/i })).toBeVisible()

  await page.goto('/login')
  await page.getByLabel('Email').fill(CUSTOMER_EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 })

  await page.goto('/restaurants')
  const firstRestaurant = page.locator('a[href^="/restaurants/"]').first()
  await expect(firstRestaurant).toBeVisible({ timeout: 20000 })
  await firstRestaurant.click()

  const addButton = page.getByRole('button', { name: 'Add' }).first()
  await expect(addButton).toBeVisible({ timeout: 20000 })
  const itemName = await page
    .locator('h3, h2')
    .filter({ hasText: /.+/ })
    .first()
    .textContent()
  await addButton.click()

  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Your Cart' })).toBeVisible()
  if (itemName) {
    await expect(page.getByText(itemName.trim(), { exact: false }).first()).toBeVisible()
  }

  await page.getByRole('button', { name: 'Proceed to checkout' }).click();
  await page.waitForURL(/\/checkout/, { timeout: 20000 })
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()

  const placeOrderButton = page.getByRole('button', { name: 'Place order' })
  await expect(placeOrderButton).toBeVisible()
  await placeOrderButton.click()
  await page.waitForURL(/\/orders\//, { timeout: 20000 })

  await expect(page.getByRole('heading', { name: /^Order #\d+$/ })).toBeVisible()
  await expect(page.getByText('Placed', { exact: true }).first()).toBeVisible({ timeout: 20000 })
  // Item names resolve via a dependent follow-up request — assert the real name shows up,
  // not the numeric-id fallback ("item #10").
  await expect(page.getByText(/^item #\d+$/)).toHaveCount(0, { timeout: 20000 })
})
