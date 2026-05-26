import { render, screen } from '@testing-library/react'
import { PublicTopBar } from '@/components/public-topbar'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

test('renders CRBox logo text', () => {
  render(<PublicTopBar />)
  expect(screen.getByText('CRBox')).toBeInTheDocument()
})

test('renders default nav: Ayuda and Ingresar', () => {
  render(<PublicTopBar />)
  expect(screen.getByText('Ayuda')).toBeInTheDocument()
  expect(screen.getByText('Ingresar')).toBeInTheDocument()
})

test('renders custom rightSlot when provided', () => {
  render(<PublicTopBar rightSlot={<span>Custom slot</span>} />)
  expect(screen.getByText('Custom slot')).toBeInTheDocument()
  expect(screen.queryByText('Ayuda')).not.toBeInTheDocument()
})
