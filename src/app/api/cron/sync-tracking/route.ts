import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { packages } from '@/db/schema'
import { ne, eq } from 'drizzle-orm'
import { getTrackingStatus } from '@/lib/track17'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const activePackages = await db
    .select({
      id: packages.id,
      trackingNumber: packages.trackingNumber,
    })
    .from(packages)
    .where(ne(packages.status, 'delivered'))

  let updated = 0
  let errors = 0

  for (const pkg of activePackages) {
    try {
      const result = await getTrackingStatus(pkg.trackingNumber)
      await db
        .update(packages)
        .set({ carrierRawStatus: result.rawStatus, carrierLastSynced: new Date() })
        .where(eq(packages.id, pkg.id))
      updated++
    } catch (err) {
      console.error(`17track sync failed for ${pkg.trackingNumber}:`, err)
      errors++
    }
  }

  return NextResponse.json({ updated, errors })
}
