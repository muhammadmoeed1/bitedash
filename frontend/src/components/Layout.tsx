import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-neutral-200 py-6 text-center text-sm text-neutral-500">
        BiteDash — a full-stack food delivery demo
      </footer>
    </div>
  )
}
