'use client'

import { useState, useRef, useEffect } from 'react'

type ClerkUser = {
  id: string
  name: string
  email: string
}

export default function UserSearch({ users }: { users: ClerkUser[] }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ClerkUser | null>(null)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? users.filter(u =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
      )
    : users

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(user: ClerkUser) {
    setSelected(user)
    setQuery(user.name)
    setOpen(false)
  }

  function handleClear() {
    setSelected(null)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="flex-1 px-3 py-2.5 text-sm outline-none"
          placeholder="Buscar usuario por nombre o correo..."
        />
        {selected && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.map(user => (
            <li
              key={user.id}
              onMouseDown={() => handleSelect(user)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 flex flex-col"
            >
              <span className="font-medium text-gray-800">{user.name}</span>
              <span className="text-xs text-gray-400">{user.email}</span>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() && filtered.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
          No se encontraron usuarios
        </div>
      )}

      <input type="hidden" name="clerkUserId" value={selected?.id ?? ''} />
    </div>
  )
}
