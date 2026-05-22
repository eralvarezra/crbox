import { PackageSearchForm } from '@/components/package-search-form'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <span className="font-bold text-lg text-indigo-700">📦 CRBox</span>
        <div className="flex items-center gap-4">
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm text-indigo-600 hover:underline"
            >
              Mis paquetes
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                Iniciar sesión
              </button>
            </SignInButton>
            <Link
              href="/sign-up"
              className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Registrarse
            </Link>
          </SignedOut>
        </div>
      </nav>
      <main className="flex flex-col items-center justify-center py-24 px-4">
        <h1 className="text-3xl font-bold mb-3 text-gray-900">
          Rastrea tu paquete
        </h1>
        <p className="text-gray-500 text-sm mb-10 text-center max-w-sm">
          Ingresa tu número de tracking para ver el estado de tu envío de USA a Costa Rica
        </p>
        <PackageSearchForm />
        <p className="text-xs text-gray-400 mt-5">
          ¿Tienes cuenta?{' '}
          <Link href="/sign-in" className="text-indigo-500 hover:underline">
            Inicia sesión
          </Link>{' '}
          para ver todos tus paquetes
        </p>
      </main>
    </div>
  )
}
