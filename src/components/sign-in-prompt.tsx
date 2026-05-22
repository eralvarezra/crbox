'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

export function SignInPrompt() {
  const { isSignedIn } = useUser()

  if (isSignedIn) return null

  return (
    <p className="text-xs text-gray-400 mt-5">
      ¿Tienes cuenta?{' '}
      <Link href="/sign-in" className="text-indigo-500 hover:underline">
        Inicia sesión
      </Link>{' '}
      para ver todos tus paquetes
    </p>
  )
}
