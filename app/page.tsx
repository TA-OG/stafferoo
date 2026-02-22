import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f8f0f5] flex flex-col items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center text-center max-w-xl w-full">

        {/* Logo */}
        <Image
          src="/stafferoo-logo.png"
          alt="Stafferoo"
          width={260}
          height={80}
          priority
          className="object-contain"
        />

        {/* Brand name below logo */}
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900">
          Stafferoo
        </h1>

        {/* Strapline */}
        <p className="mt-3 text-lg text-gray-500 leading-relaxed">
          Qualified early years staff, on demand.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/settings/register"
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#bf5d9f] text-white px-10 py-6 shadow-lg hover:opacity-90 transition-opacity w-full sm:w-56"
          >
            <span className="text-2xl" aria-hidden="true">🏫</span>
            <span className="text-base font-bold leading-tight">Early Years Business</span>
            <span className="text-xs opacity-75 font-medium">Sign up / Log in</span>
          </Link>

          <Link
            href="/staff/onboarding"
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white border-2 border-[rgba(180,156,220,0.6)] text-gray-900 px-10 py-6 shadow-md hover:border-[#bf5d9f] hover:shadow-lg transition-all w-full sm:w-56"
          >
            <span className="text-2xl" aria-hidden="true">🎓</span>
            <span className="text-base font-bold leading-tight">Early Years Qualified Staff</span>
            <span className="text-xs text-gray-400 font-medium">Sign up / Log in</span>
          </Link>
        </div>

      </div>
    </main>
  );
}
