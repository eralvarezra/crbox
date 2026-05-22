import { render, screen } from '@testing-library/react'
import { StatusBadge } from './status-badge'

describe('StatusBadge', () => {
  it('displays the correct label for each status', () => {
    const { rerender } = render(<StatusBadge status="received_usa" />)
    expect(screen.getByText('Recibido en bodega USA')).toBeInTheDocument()

    rerender(<StatusBadge status="in_transit" />)
    expect(screen.getByText('En tránsito')).toBeInTheDocument()

    rerender(<StatusBadge status="in_customs" />)
    expect(screen.getByText('En aduana CR')).toBeInTheDocument()

    rerender(<StatusBadge status="ready_pickup" />)
    expect(screen.getByText('Listo para retirar')).toBeInTheDocument()

    rerender(<StatusBadge status="delivered" />)
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('applies amber color class for in_customs status', () => {
    render(<StatusBadge status="in_customs" />)
    const badge = screen.getByText('En aduana CR')
    expect(badge).toHaveClass('bg-amber-100')
    expect(badge).toHaveClass('text-amber-700')
  })

  it('applies green color class for ready_pickup status', () => {
    render(<StatusBadge status="ready_pickup" />)
    const badge = screen.getByText('Listo para retirar')
    expect(badge).toHaveClass('bg-green-100')
  })
})
