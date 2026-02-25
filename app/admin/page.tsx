import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase-server";
import { isCurrentUserAdmin } from "@/app/lib/admin";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export default async function AdminDashboard() {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  const supabase = await createClient();

  const [staffResult, settingsResult] = await Promise.all([
    supabase
      .from("staff_profiles")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "pending"),
    supabase
      .from("setting_profiles")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "pending"),
  ]);

  const pendingStaff = staffResult.count ?? 0;
  const pendingSettings = settingsResult.count ?? 0;

  const cards = [
    {
      title: "Staff Queue",
      href: "/admin/staff",
      count: pendingStaff,
      description: "Pending staff verifications",
      colour: "bg-blue-50 border-blue-200 text-blue-700",
    },
    {
      title: "Business Queue",
      href: "/admin/settings",
      count: pendingSettings,
      description: "Pending business verifications",
      colour: "bg-emerald-50 border-emerald-200 text-emerald-700",
    },
    {
      title: "Postcode Density",
      href: "/admin/postcodes",
      count: null,
      description: "Staff and businesses by postcode",
      colour: "bg-amber-50 border-amber-200 text-amber-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs items={[{ label: "Admin" }]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Platform overview and verification queues
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`block rounded-lg border p-6 transition-shadow hover:shadow-md ${card.colour}`}
            >
              <h2 className="text-lg font-semibold mb-1">{card.title}</h2>
              <p className="text-sm opacity-80 mb-4">{card.description}</p>
              {card.count !== null && (
                <span className="text-3xl font-bold">{card.count}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
