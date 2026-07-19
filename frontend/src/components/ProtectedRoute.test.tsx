import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuth } from '../store/auth'

vi.mock('../store/auth', () => ({ useAuth: vi.fn() }))

function renderAt(path: string, roles?: ('customer' | 'admin')[]) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/" element={<div>Home page</div>} />
        <Route
          path="/secret"
          element={
            <ProtectedRoute roles={roles}>
              <div>Secret content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('shows a loader while auth is still initializing', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, initializing: true } as never)
    renderAt('/secret')
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('redirects to /login when there is no authenticated user', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, initializing: false } as never)
    renderAt('/secret')
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects home when the user has the wrong role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { user_id: 1, email: 'a@b.com', role: 'customer' },
      initializing: false,
    } as never)
    renderAt('/secret', ['admin'])
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })

  it('renders the protected content for an authorized user', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { user_id: 1, email: 'a@b.com', role: 'admin' },
      initializing: false,
    } as never)
    renderAt('/secret', ['admin'])
    expect(screen.getByText('Secret content')).toBeInTheDocument()
  })
})
