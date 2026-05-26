import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { packages } from '@/db/schema'
import { isNotNull, ne, and, eq } from 'drizzle-orm'
import { getCarrierStatus } from '@/lib/carriers'
import type { Carrier } from '@/lib/carriers'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const activePackages = await db
    .select({
      id: packages.id,
      trackingNumber: packages.trackingNumber,
      carrier: packages.carrier,
    })
    .from(packages)
    .where(
      and(
        isNotNull(packages.carrier),
        ne(packages.status, 'delivered')
      )
    )

  let updated = 0
  let errors = 0

  for (const pkg of activePackages) {
    if (!pkg.carrier) continue
    try {
      const result = await getCarrierStatus(pkg.carrier as Carrier, pkg.trackingNumber)
      await db
        .update(packages)
        .set({ carrierRawStatus: result.rawStatus, carrierLastSynced: new Date() })
        .where(eq(packages.id, pkg.id))
      updated++
    } catch (err) {
      console.error(`Carrier sync failed for ${pkg.trackingNumber}:`, err)
      errors++
    }
  }

  return NextResponse.json({ updated, errors })
}
