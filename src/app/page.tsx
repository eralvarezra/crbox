import { PackageSearchForm } from '@/components/package-search-form'
import { NavBar } from '@/components/nav-bar'
import { SignInPrompt } from '@/components/sign-in-prompt'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="flex flex-col items-center justify-center py-24 px-4">
        <h1 className="text-3xl font-bold mb-3 text-gray-900">
          Rastrea tu paquete
        </h1>
        <p className="text-gray-500 text-sm mb-10 text-center max-w-sm">
          Ingresa tu número de tracking para ver el estado de tu envío de USA a Costa Rica
        </p>
        <PackageSearchForm />
        <SignInPrompt />
        <div className="mt-10 border-t pt-8 text-center">
          <p className="text-sm text-gray-500 mb-3">¿Tienes un paquete que aún no está en el sistema?</p>
          <Link
            href="/request"
            className="inline-block bg-white border border-indigo-300 text-indigo-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
          >
            Registrar mi paquete
          </Link>
        </div>
      </main>
    </div>
  )
}
