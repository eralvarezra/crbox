'use client'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'

export function PublicNavRight() {
  const { isSignedIn } = useUser()
  return (
    <div className="flex items-center gap-4">
      {isSignedIn ? (
        <>
          <Link
            href="/dashboard"
            className="text-[13.5px] text-[#525252] hover:text-[#0A0A0A] transition-colors font-medium"
          >
            Mis paquetes
          </Link>
          <UserButton />
        </>
      ) : (
        <>
          <SignInButton mode="modal">
            <button
              type="button"
              className="text-[#525252] hover:text-[#0A0A0A] transition-colors bg-transparent border-0 cursor-pointer font-medium text-[13.5px] font-sans p-0"
            >
              Iniciar sesión
            </button>
          </SignInButton>
          <Link
            href="/sign-up"
            className="px-[14px] py-[7px] rounded-[8px] bg-[#4F46E5] text-white text-[13px] font-medium hover:bg-[#4338CA] transition-colors"
          >
            Registrarse
          </Link>
        </>
      )}
    </div>
  )
}
