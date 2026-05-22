import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <p className="text-5xl mb-4">📦</p>
      <h1 className="text-xl font-bold mb-2 text-gray-800">
        Tracking number no encontrado
      </h1>
      <p className="text-gray-500 text-sm mb-8 text-center max-w-sm">
        No encontramos ningún paquete con ese número de tracking. Verifica el número e intenta nuevamente.
      </p>
      <Link
        href="/"
        className="text-sm bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
