'use client'

import { SignInButton, UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'

export function NavBar() {
  const { isSignedIn } = useUser()

  return (
    <nav className="bg-white border-b px-6 py-3 flex justify-between items-center">
      <Link href="/" className="font-bold text-lg text-indigo-700 hover:opacity-80 transition-opacity">
        📦 CRBox
      </Link>
      <div className="flex items-center gap-4">
        {isSignedIn ? (
          <>
            <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
              Mis paquetes
            </Link>
            <UserButton />
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </nav>
  )
}
