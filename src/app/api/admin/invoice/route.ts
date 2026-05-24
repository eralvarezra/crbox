import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { sessionClaims } = await auth()
  if ((sessionClaims?.metadata as { role?: string })?.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url', { status: 400 })

  const blobRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  })

  if (!blobRes.ok) {
    return new NextResponse('Could not fetch invoice', { status: blobRes.status })
  }

  const contentType = blobRes.headers.get('content-type') ?? 'application/octet-stream'
  const body = await blobRes.arrayBuffer()

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=300',
    },
  })
}
