import type React from 'react'
import Link from 'next/link'
import { PublicNavRight } from './public-nav-right'

function Logo() {
  return (
    <div className="flex items-center gap-[9px]">
      <div className="w-[26px] h-[26px] rounded-[7px] bg-[#0A0A0A] relative grid place-items-center flex-shrink-0">
        <div className="absolute inset-[5px] border-[1.5px] border-[#4F46E5] rounded-[3px]" />
        <div className="absolute left-1/2 top-[5px] bottom-[5px] w-[1.5px] bg-[#4F46E5] -translate-x-1/2" />
      </div>
      <span className="font-semibold text-[16px] tracking-[-0.02em] text-[#0A0A0A]">CRBox</span>
    </div>
  )
}

export function PublicTopBar({ rightSlot }: { rightSlot?: React.ReactNode }) {
  return (
    <header className="h-16 shrink-0 sticky top-0 z-10 px-10 flex items-center justify-between border-b border-[#EDEDED] bg-white/85 backdrop-blur-[8px]">
      <Link href="/" aria-label="CRBox inicio">
        <Logo />
      </Link>
      <div className="flex items-center gap-4 text-[13.5px] text-[#525252] font-medium">
        {rightSlot ?? <PublicNavRight />}
      </div>
    </header>
  )
}
