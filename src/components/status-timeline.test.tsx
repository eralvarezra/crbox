import { render, screen } from '@testing-library/react'
import { StatusTimeline } from './status-timeline'

describe('StatusTimeline', () => {
  it('renders all 5 status labels', () => {
    render(<StatusTimeline currentStatus="received_usa" history={[]} />)
    expect(screen.getByText('Recibido en bodega USA')).toBeInTheDocument()
    expect(screen.getByText('En tránsito')).toBeInTheDocument()
    expect(screen.getByText('En aduana CR')).toBeInTheDocument()
    expect(screen.getByText('Listo para retirar')).toBeInTheDocument()
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('shows history note when present', () => {
    render(
      <StatusTimeline
        currentStatus="in_customs"
        history={[
          { status: 'in_customs', note: 'Requiere documentos', createdAt: new Date('2026-05-19') },
        ]}
      />
    )
    expect(screen.getByText('Requiere documentos')).toBeInTheDocument()
  })

  it('does not show note when history has no note', () => {
    render(
      <StatusTimeline
        currentStatus="in_transit"
        history={[
          { status: 'in_transit', note: null, createdAt: new Date('2026-05-18') },
        ]}
      />
    )
    expect(screen.queryByText('null')).not.toBeInTheDocument()
  })
})
