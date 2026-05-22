import { PackageSearchForm } from '@/components/package-search-form'
import { NavBar } from '@/components/nav-bar'
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
