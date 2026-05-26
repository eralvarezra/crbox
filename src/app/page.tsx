import Link from 'next/link'
import { PackageSearchForm } from '@/components/package-search-form'
import { PublicTopBar } from '@/components/public-topbar'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicTopBar />
      <main className="flex-1 relative grid place-items-center py-12">
        {/* Grid background */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 0%, rgba(79,70,229,0.06), transparent 50%),
              linear-gradient(#F4F4F4 1px, transparent 1px),
              linear-gradient(90deg, #F4F4F4 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 56px 56px, 56px 56px',
            maskImage: 'radial-gradient(80% 70% at 50% 30%, #000 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(80% 70% at 50% 30%, #000 30%, transparent 80%)',
          }}
        />

        <div className="relative z-10 w-full max-w-[560px] px-8 flex flex-col items-center text-center">
          {/* Eyebrow badge */}
          <span
            className="inline-flex items-center gap-2 pl-[6px] pr-3 py-[5px] rounded-full bg-white border border-[#E5E5E5] text-[12.5px] font-medium text-[#404040]"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}
          >
            <span className="inline-flex items-center gap-[5px] px-2 py-[2px] rounded-full bg-[rgba(16,185,129,.1)] text-[#047857] text-[11px] font-semibold tracking-[0.01em]">
              <span className="w-[5px] h-[5px] rounded-full bg-[#10B981] shrink-0" />
              EN VIVO
            </span>
            <span>Rastreo público · USA → Costa Rica</span>
          </span>

          {/* Headline */}
          <h1 className="text-[48px] leading-[1.05] tracking-[-0.035em] font-semibold mt-7 mb-[14px] text-[#0A0A0A]">
            Rastrea tu paquete<br />desde USA.
          </h1>

          <p className="text-[16px] text-[#737373] max-w-[420px] leading-[1.55] m-0">
            Ingresá tu número de tracking para ver el estado de tu paquete en tiempo real.
          </p>

          {/* Search form */}
          <div className="mt-10 w-full">
            <PackageSearchForm />
          </div>

          {/* Register CTA */}
          <div className="mt-5 flex items-center gap-[6px] text-[13px] text-[#737373]">
            <span>¿Aún no tenés cuenta?</span>
            <Link
              href="/request"
              className="text-[#4F46E5] font-medium hover:underline"
            >
              Registrar mi paquete →
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-14 flex gap-8 items-center pt-6 border-t border-[#EDEDED] w-full justify-center">
            {[
              ['28,400+', 'paquetes entregados'],
              ['3–5 días', 'Miami → SJO'],
              ['98.7%', 'puntualidad'],
            ].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="text-[18px] font-semibold tracking-[-0.02em] text-[#0A0A0A]">{n}</div>
                <div className="text-[12px] text-[#737373] mt-[2px]">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
