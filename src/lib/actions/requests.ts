'use server'

import { db } from '@/db'
import { packageRequests, packages, statusHistory } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { put } from '@vercel/blob'
import { sendRequestApproved, sendRequestRejected } from '@/lib/whatsapp'

async function requireAdmin() {
  const { sessionClaims } = await auth()
  if ((sessionClaims?.metadata as { role?: string })?.role !== 'admin') {
    throw new Error('Unauthorized')
  }
}

export async function submitPackageRequest(formData: FormData) {
  const { userId } = await auth()

  const trackingNumber = formData.get('trackingNumber')?.toString().trim().toUpperCase()
  const whatsappNumber = formData.get('whatsappNumber')?.toString().trim()
  const invoiceFile = formData.get('invoice') as File

  if (!trackingNumber || !whatsappNumber) throw new Error('Faltan campos requeridos')
  if (!invoiceFile || invoiceFile.size === 0) throw new Error('La factura es requerida')

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
  if (!ALLOWED_MIME_TYPES.includes(invoiceFile.type)) {
    throw new Error('Tipo de archivo no permitido. Solo se aceptan imágenes y PDF.')
  }

  let customerName: string | null = null

  if (userId) {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    customerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null
  } else {
    customerName = formData.get('customerName')?.toString().trim() || null
    if (!customerName) throw new Error('El nombre es requerido')
  }

  const blob = await put(`invoices/${Date.now()}-${invoiceFile.name}`, invoiceFile, {
    access: 'private',
  })

  await db.insert(packageRequests).values({
    trackingNumber,
    customerName,
    whatsappNumber,
    invoiceUrl: blob.url,
    clerkUserId: userId ?? null,
    status: 'pending',
  })

  redirect('/request?success=1')
}

export async function approveRequest(requestId: string, formData: FormData) {
  await requireAdmin()

  const request = await db.query.packageRequests.findFirst({
    where: eq(packageRequests.id, requestId),
  })
  if (!request) throw new Error('Solicitud no encontrada')
  if (request.status !== 'pending') throw new Error('Esta solicitud ya fue procesada')

  const existing = await db.query.packages.findFirst({
    where: eq(packages.trackingNumber, request.trackingNumber),
    columns: { id: true },
  })
  if (existing) {
    redirect(`/admin/requests/${requestId}?duplicate=1`)
  }

  const customerName = request.customerName ?? 'Cliente'

  let pkg: typeof packages.$inferSelect
  try {
    const [inserted] = await db
      .insert(packages)
      .values({
        trackingNumber: request.trackingNumber,
        customerName,
        whatsappNumber: request.whatsappNumber,
        clerkUserId: request.clerkUserId,
      })
      .returning()
    pkg = inserted
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('23505') || msg.includes('unique')) {
      redirect(`/admin/requests/${requestId}?duplicate=1`)
    }
    throw err
  }

  await db.insert(statusHistory).values({
    packageId: pkg.id,
    status: 'received_usa',
    note: null,
  })

  await db
    .update(packageRequests)
    .set({ status: 'approved', updatedAt: new Date() })
    .where(eq(packageRequests.id, requestId))

  try {
    await sendRequestApproved({
      to: request.whatsappNumber,
      customerName,
      trackingNumber: request.trackingNumber,
    })
  } catch (err) {
    console.error('WhatsApp notification failed:', err)
    redirect(`/admin/requests/${requestId}?whatsapp_error=1`)
  }

  redirect('/admin/requests')
}

export async function rejectRequest(requestId: string, formData: FormData) {
  await requireAdmin()

  const reason = formData.get('reason')?.toString().trim()
  if (!reason) throw new Error('El motivo de rechazo es requerido')

  const request = await db.query.packageRequests.findFirst({
    where: eq(packageRequests.id, requestId),
  })
  if (!request) throw new Error('Solicitud no encontrada')
  if (request.status !== 'pending') throw new Error('Esta solicitud ya fue procesada')

  const customerName = request.customerName ?? 'Cliente'

  await db
    .update(packageRequests)
    .set({ status: 'rejected', rejectionReason: reason, updatedAt: new Date() })
    .where(eq(packageRequests.id, requestId))

  try {
    await sendRequestRejected({
      to: request.whatsappNumber,
      customerName,
      trackingNumber: request.trackingNumber,
      reason,
    })
  } catch (err) {
    console.error('WhatsApp notification failed:', err)
    redirect(`/admin/requests/${requestId}?whatsapp_error=1`)
  }

  redirect('/admin/requests')
}
