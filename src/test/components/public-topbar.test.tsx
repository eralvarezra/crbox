import { render, screen } from '@testing-library/react'
import { PublicTopBar } from '@/components/public-topbar'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ isSignedIn: false }),
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => <button type="button">UserButton</button>,
}))

test('renders CRBox logo text', () => {
  render(<PublicTopBar />)
  expect(screen.getByText('CRBox')).toBeInTheDocument()
})

test('renders default nav with sign-in and register when signed out', () => {
  render(<PublicTopBar />)
  expect(screen.getByText('Iniciar sesión')).toBeInTheDocument()
  expect(screen.getByText('Registrarse')).toBeInTheDocument()
})

test('renders custom rightSlot when provided', () => {
  render(<PublicTopBar rightSlot={<span>Custom slot</span>} />)
  expect(screen.getByText('Custom slot')).toBeInTheDocument()
  expect(screen.queryByText('Iniciar sesión')).not.toBeInTheDocument()
})
