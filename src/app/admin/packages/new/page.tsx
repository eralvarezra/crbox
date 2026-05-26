import { createPackage } from '@/lib/actions/packages'
import { clerkClient } from '@clerk/nextjs/server'
import PhoneInput from '@/components/phone-input'
import UserSearch from '@/components/user-search'

export default async function NewPackagePage() {
  const client = await clerkClient()
  const { data: clerkUsers } = await client.users.getUserList({ limit: 100 })

  const users = clerkUsers.map(u => ({
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || u.id,
    email: u.emailAddresses[0]?.emailAddress ?? '',
  }))

  return (
    <>
      <h1 className="text-xl font-bold mb-6">Nuevo paquete</h1>
      <form action={createPackage} className="bg-white rounded-xl shadow-sm p-6 max-w-lg space-y-5">
        <div>
          <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
            Tracking Number *
          </label>
          <input
            name="trackingNumber"
            required
            className="w-full border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="1Z999AA10123456784"
          />
        </div>
        <div>
          <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
            Carrier *
          </label>
          <select
            name="carrier"
            required
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Selecciona un carrier</option>
            <option value="ups">UPS</option>
            <option value="fedex">FedEx</option>
            <option value="usps">USPS</option>
            <option value="dhl">DHL</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
            Nombre del cliente *
          </label>
          <input
            name="customerName"
            required
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Juan Pérez"
          />
        </div>
        <div>
          <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
            Descripción (opcional)
          </label>
          <input
            name="description"
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Laptop Dell XPS 15"
          />
        </div>
        <div>
          <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
            WhatsApp (opcional)
          </label>
          <PhoneInput />
        </div>
        <div>
          <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
            Vincular usuario (opcional)
          </label>
          <UserSearch users={users} />
          <p className="text-xs text-gray-400 mt-1">
            Vincula este paquete a una cuenta registrada
          </p>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Crear paquete
        </button>
      </form>
    </>
  )
}
