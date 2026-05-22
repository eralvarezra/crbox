import { auth, clerkClient } from '@clerk/nextjs/server'
import { NavBar } from '@/components/nav-bar'
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
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-full max-w-lg">
          <h1 className="text-2xl font-bold mb-2 text-center text-gray-900">
            Registrar mi paquete
          </h1>
          <p className="text-sm text-gray-500 text-center mb-8">
            Envía tu tracking number y factura para que podamos agregar tu paquete al sistema.
          </p>
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-10 text-center">
              <p className="text-green-800 font-semibold text-lg mb-1">¡Solicitud enviada!</p>
              <p className="text-green-700 text-sm">
                Revisaremos tu información y te notificaremos por WhatsApp.
              </p>
            </div>
          ) : (
            <RequestForm isLoggedIn={!!userId} userName={userName} />
          )}
        </div>
      </main>
    </div>
  )
}
