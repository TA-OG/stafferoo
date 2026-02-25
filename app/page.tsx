import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const tiles: Tile[] = [
    {
      title: "Sign in",
      description: "Access your account and continue where you left off.",
      href: "/auth",
      badge: "Auth",
    },
    {
      title: "Staff onboarding",
      description: "Complete your profile, upload documents, submit for review.",
      href: "/staff/onboarding",
      badge: "Staff",
    },
    {
      title: "My dashboard",
      description: "Check your status, manage availability and notification preferences.",
      href: "/staff/dashboard",
      badge: "Staff",
    },
    {
      title: "Register your business",
      description: "Register your Early Years Childcare Business and start booking staff.",
      href: "/settings/register",
      badge: "Business",
    },
    {
      title: "Admin Dashboard",
      description: "Platform overview, verification queues, and postcode density.",
      href: "/admin",
      badge: "Admin",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f8f0f5] flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Logo */}
        <Image
          src="/stafferoo-logo.png"
          alt="Stafferoo"
          width={280}
          height={80}
          priority
          className="object-contain mb-6"
        />

        {/* Strapline */}
        <p className="text-center text-gray-600 text-lg max-w-md mb-12 leading-relaxed">
          Connecting qualified early years staff with childcare businesses — fast, compliant, and reliable.
        </p>

        {/* Two big CTAs */}
        <div className="flex flex-col sm:flex-row gap-5 w-full max-w-xl">
          <Link
            href="/auth?role=staff"
            className="flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-[#bf5d9f] bg-white px-8 py-10 text-center shadow-lg transition hover:shadow-xl hover:-translate-y-0.5 hover:border-[#a04d87]"
          >
            <span className="text-4xl" aria-hidden="true">👤</span>
            <span className="text-xl font-bold text-gray-900">
              Sign up as Staff
            </span>
            <span className="text-sm text-gray-500">
              Start your onboarding and get verified
            </span>
          </Link>

          <Link
            href="/auth?role=setting"
            className="flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-[#b49cdc] bg-white px-8 py-10 text-center shadow-lg transition hover:shadow-xl hover:-translate-y-0.5 hover:border-[#9478c4]"
          >
            <span className="text-4xl" aria-hidden="true">🏫</span>
            <span className="text-xl font-bold text-gray-900 leading-tight">
              Sign up as Early Years Childcare Business
            </span>
            <span className="text-sm text-gray-500">
              Register your business and book staff
            </span>
          </Link>
        </div>

        {/* Already have an account */}
        <p className="mt-10 text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/auth" className="font-semibold text-[#bf5d9f] hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400 space-x-4">
        <Link href="/terms" className="hover:text-gray-600 transition-colors">
          Terms of Use
        </Link>
        <span aria-hidden="true">·</span>
        <a href="mailto:support@stafferoo.app" className="hover:text-gray-600 transition-colors">
          Support
        </a>
      </footer>
    </main>
  );
}
