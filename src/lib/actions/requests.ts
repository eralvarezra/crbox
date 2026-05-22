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
    access: 'public',
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
