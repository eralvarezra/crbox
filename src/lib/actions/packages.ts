'use server'

import { db } from '@/db'
import { packages, statusHistory } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { sendStatusUpdate } from '@/lib/whatsapp'
import type { PackageStatus } from '@/lib/status'

async function requireAdmin() {
  const { sessionClaims } = await auth()
  if ((sessionClaims?.metadata as { role?: string })?.role !== 'admin') {
    throw new Error('Unauthorized')
  }
}

export async function createPackage(formData: FormData) {
  await requireAdmin()

  const trackingNumber = (formData.get('trackingNumber') as string).trim().toUpperCase()
  const customerName = (formData.get('customerName') as string).trim()
  const description = (formData.get('description') as string)?.trim() || null
  const whatsappNumber = (formData.get('whatsappNumber') as string)?.trim() || null
  const clerkUserId = (formData.get('clerkUserId') as string)?.trim() || null

  const [pkg] = await db
    .insert(packages)
    .values({ trackingNumber, customerName, description, whatsappNumber, clerkUserId })
    .returning()

  await db.insert(statusHistory).values({
    packageId: pkg.id,
    status: 'received_usa',
    note: null,
  })

  redirect('/admin')
}

export async function updatePackageStatus(packageId: string, formData: FormData) {
  await requireAdmin()

  const status = formData.get('status') as PackageStatus
  const note = (formData.get('note') as string)?.trim() || null

  const [pkg] = await db
    .update(packages)
    .set({ status, updatedAt: new Date() })
    .where(eq(packages.id, packageId))
    .returning()

  await db.insert(statusHistory).values({ packageId, status, note })

  if (pkg.whatsappNumber) {
    try {
      await sendStatusUpdate({
        to: pkg.whatsappNumber,
        customerName: pkg.customerName,
        trackingNumber: pkg.trackingNumber,
        status,
        note,
      })
    } catch (err) {
      console.error('WhatsApp notification failed:', err)
    }
  }

  redirect('/admin')
}

export async function linkPackageToUser(trackingNumber: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  await db
    .update(packages)
    .set({ clerkUserId: userId })
    .where(eq(packages.trackingNumber, trackingNumber))
}
