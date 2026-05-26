import { auth, clerkClient } from '@clerk/nextjs/server'
import Link from 'next/link'
import { PublicTopBar } from '@/components/public-topbar'
import RequestForm from '@/components/request-form'

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams
  const { userId } = await auth()

  let userName: string | null = null
  if (userId) {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicTopBar />
      <main className="flex-1 relative flex flex-col items-center py-14 px-4">
        {/* Grid background */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 0%, rgba(79,70,229,0.05), transparent 50%),
              linear-gradient(#F4F4F4 1px, transparent 1px),
              linear-gradient(90deg, #F4F4F4 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 56px 56px, 56px 56px',
            maskImage: 'radial-gradient(80% 60% at 50% 20%, #000 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(80% 60% at 50% 20%, #000 30%, transparent 80%)',
          }}
        />

        <div className="relative z-10 w-full max-w-[480px]">
          <div className="text-center mb-8">
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-[#0A0A0A] leading-tight mb-2">
              Registrar mi paquete
            </h1>
            <p className="text-[14.5px] text-[#737373] leading-relaxed">
              Enviá tu tracking number y factura para que agreguemos tu paquete al sistema.
            </p>
          </div>

          {success ? (
            <div className="bg-white border border-[#E5E5E5] rounded-[14px] px-8 py-10 text-center"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)' }}
            >
              <div className="w-11 h-11 rounded-full bg-[rgba(16,185,129,.1)] grid place-items-center mx-auto mb-4">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M4 10l4.5 4.5L16 6" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[16px] font-semibold text-[#0A0A0A] mb-1">¡Solicitud enviada!</p>
              <p className="text-[13.5px] text-[#737373]">
                Revisaremos tu información y te notificaremos por WhatsApp.
              </p>
              <Link
                href="/"
                className="inline-block mt-6 text-[13px] text-[#4F46E5] font-medium hover:underline"
              >
                ← Volver al inicio
              </Link>
            </div>
          ) : (
            <RequestForm isLoggedIn={!!userId} userName={userName} />
          )}
        </div>
      </main>
    </div>
  )
}
