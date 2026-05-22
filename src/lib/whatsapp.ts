import twilio from 'twilio'
import { STATUS_LABELS } from './status'

function getClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
}

export async function sendStatusUpdate(params: {
  to: string
  customerName: string
  trackingNumber: string
  status: string
  note?: string | null
}): Promise<void> {
  const { to, customerName, trackingNumber, status, note } = params
  const statusLabel = STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status
  const noteText = note ? ` ${note}` : ''
  const body = `Hola ${customerName}, tu paquete ${trackingNumber} ha sido actualizado: *${statusLabel}*.${noteText}`

  await getClient().messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${to}`,
    body,
  })
}

export async function sendRequestApproved(params: {
  to: string
  customerName: string
  trackingNumber: string
}): Promise<void> {
  const { to, customerName, trackingNumber } = params
  const body = `Hola ${customerName}, tu solicitud para el paquete ${trackingNumber} fue aprobada. Ya puedes rastrear tu paquete en nuestro sistema.`
  await getClient().messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${to}`,
    body,
  })
}

export async function sendRequestRejected(params: {
  to: string
  customerName: string
  trackingNumber: string
  reason: string
}): Promise<void> {
  const { to, customerName, trackingNumber, reason } = params
  const body = `Hola ${customerName}, tu solicitud para el paquete ${trackingNumber} fue rechazada. Motivo: ${reason}.`
  await getClient().messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${to}`,
    body,
  })
}
