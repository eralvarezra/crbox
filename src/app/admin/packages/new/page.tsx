import { createPackage } from '@/lib/actions/packages'

export default function NewPackagePage() {
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
          <input
            name="whatsappNumber"
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="+50688888888"
          />
          <p className="text-xs text-gray-400 mt-1">
            Formato internacional: +506 para Costa Rica
          </p>
        </div>
        <div>
          <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
            Clerk User ID (opcional)
          </label>
          <input
            name="clerkUserId"
            className="w-full border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="user_2abc..."
          />
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
