'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function PackageSearchForm() {
  const router = useRouter()
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim().toUpperCase()
    if (trimmed) router.push(`/track/${trimmed}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-[18px]">
      <div className="w-full flex gap-[10px]">
        <div
          className="flex-1 flex items-center gap-[10px] px-4 h-[52px] bg-white border border-[#E5E5E5] rounded-xl"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,.04), 0 4px 12px -8px rgba(0,0,0,.08)' }}
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="#A3A3A3" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className="shrink-0"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Ej: 1Z999AA10123456784"
            className="flex-1 border-0 outline-none bg-transparent font-mono text-[14.5px] font-medium text-[#0A0A0A] tracking-[0.01em] placeholder:text-[#A3A3A3]"
            autoComplete="off"
            spellCheck={false}
          />
          {value && (
            <button
              type="button"
              onClick={() => setValue('')}
              aria-label="✕"
              className="border-0 bg-transparent text-[#A3A3A3] cursor-pointer p-1 hover:text-[#525252] transition-colors leading-none"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-[52px] px-6 rounded-xl bg-[#4F46E5] text-white font-semibold text-[14.5px] flex items-center gap-2 cursor-pointer border-0 hover:bg-[#4338CA] transition-colors"
          style={{ boxShadow: '0 1px 0 rgba(255,255,255,.15) inset, 0 4px 14px -4px rgba(79,70,229,.55)' }}
        >
          Rastrear
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
      <div className="text-[12.5px] text-[#737373] flex items-center gap-2">
        <kbd className="font-mono text-[11px] px-[7px] py-[2px] rounded-[5px] bg-[#F5F5F5] border border-[#E5E5E5] text-[#404040]">
          ↵
        </kbd>
        <span>Presioná Enter o usá tu código CRB-XXXXX</span>
      </div>
    </form>
  )
}
