import { render, screen, fireEvent } from '@testing-library/react'
import { PackageSearchForm } from '@/components/package-search-form'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => mockPush.mockClear())

test('renders search input with correct placeholder', () => {
  render(<PackageSearchForm />)
  expect(screen.getByPlaceholderText(/1Z999AA10123456784/i)).toBeInTheDocument()
})

test('renders Rastrear submit button', () => {
  render(<PackageSearchForm />)
  expect(screen.getByRole('button', { name: /rastrear/i })).toBeInTheDocument()
})

test('shows clear button only when input has a value', () => {
  render(<PackageSearchForm />)
  expect(screen.queryByRole('button', { name: '✕' })).not.toBeInTheDocument()
  fireEvent.change(screen.getByPlaceholderText(/1Z999AA10123456784/i), {
    target: { value: 'ABC123' },
  })
  expect(screen.getByRole('button', { name: '✕' })).toBeInTheDocument()
})

test('clear button resets input value', () => {
  render(<PackageSearchForm />)
  const input = screen.getByPlaceholderText(/1Z999AA10123456784/i)
  fireEvent.change(input, { target: { value: 'ABC123' } })
  fireEvent.click(screen.getByRole('button', { name: '✕' }))
  expect(input).toHaveValue('')
})

test('submits by navigating to /track/:TRACKING uppercased', () => {
  render(<PackageSearchForm />)
  fireEvent.change(screen.getByPlaceholderText(/1Z999AA10123456784/i), {
    target: { value: '1z999aa1' },
  })
  fireEvent.submit(screen.getByRole('button', { name: /rastrear/i }).closest('form')!)
  expect(mockPush).toHaveBeenCalledWith('/track/1Z999AA1')
})
