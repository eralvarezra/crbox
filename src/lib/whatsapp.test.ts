import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()

vi.mock('twilio', () => ({
  default: () => ({
    messages: { create: mockCreate },
  }),
}))

import { sendStatusUpdate, sendRequestApproved, sendRequestRejected } from './whatsapp'

describe('sendStatusUpdate', () => {
  beforeEach(() => {
    mockCreate.mockClear()
    mockCreate.mockResolvedValue({ sid: 'SM123' })
    process.env.TWILIO_WHATSAPP_FROM = '+14155238886'
  })

  it('sends a WhatsApp message with the correct body', async () => {
    await sendStatusUpdate({
      to: '+50688888888',
      customerName: 'Juan Pérez',
      trackingNumber: '1Z999AA1',
      status: 'in_transit',
    })

    expect(mockCreate).toHaveBeenCalledWith({
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+50688888888',
      body: 'Hola Juan Pérez, tu paquete 1Z999AA1 ha sido actualizado: *En tránsito*.',
    })
  })

  it('appends note to message when provided', async () => {
    await sendStatusUpdate({
      to: '+50688888888',
      customerName: 'Juan Pérez',
      trackingNumber: '1Z999AA1',
      status: 'in_customs',
      note: 'Requiere documentos',
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'Hola Juan Pérez, tu paquete 1Z999AA1 ha sido actualizado: *En aduana CR*. Requiere documentos',
      })
    )
  })

  it('does not append note when note is null', async () => {
    await sendStatusUpdate({
      to: '+50688888888',
      customerName: 'María',
      trackingNumber: 'ABC123',
      status: 'delivered',
      note: null,
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'Hola María, tu paquete ABC123 ha sido actualizado: *Entregado*.',
      })
    )
  })
})

describe('sendRequestApproved', () => {
  beforeEach(() => {
    mockCreate.mockClear()
    mockCreate.mockResolvedValue({ sid: 'SM123' })
    process.env.TWILIO_WHATSAPP_FROM = '+14155238886'
  })

  it('sends approval message with tracking number', async () => {
    await sendRequestApproved({
      to: '+50688888888',
      customerName: 'Juan Pérez',
      trackingNumber: '1Z999AA1',
    })

    expect(mockCreate).toHaveBeenCalledWith({
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+50688888888',
      body: 'Hola Juan Pérez, tu solicitud para el paquete 1Z999AA1 fue aprobada. Ya puedes rastrear tu paquete en nuestro sistema.',
    })
  })
})

describe('sendRequestRejected', () => {
  beforeEach(() => {
    mockCreate.mockClear()
    mockCreate.mockResolvedValue({ sid: 'SM123' })
    process.env.TWILIO_WHATSAPP_FROM = '+14155238886'
  })

  it('sends rejection message with reason', async () => {
    await sendRequestRejected({
      to: '+50688888888',
      customerName: 'Juan Pérez',
      trackingNumber: '1Z999AA1',
      reason: 'La factura no es legible',
    })

    expect(mockCreate).toHaveBeenCalledWith({
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+50688888888',
      body: 'Hola Juan Pérez, tu solicitud para el paquete 1Z999AA1 fue rechazada. Motivo: La factura no es legible.',
    })
  })
})
