import Image from "next/image";
import Link from "next/link";
import styles from "./home.module.css";

type Tile = {
  title: string;
  description: string;
  href: string;
  badge?: string;
};

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
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.logoWrap}>
              <Image
                src="/stafferoo-logo.png"
                alt="Stafferoo"
                width={220}
                height={60}
                priority
                className={styles.logo}
              />
            </div>

            <div className={styles.brandText}>
              <h1 className={styles.title}>Stafferoo</h1>
              <p className={styles.subtitle}>
                Staff onboarding and bookings, built for speed and compliance.
              </p>
            </div>
          </div>

          <div className={styles.ctaRow}>
            <Link href="/auth" className={styles.primaryButton}>
              Sign in
            </Link>
            <Link href="/staff/onboarding" className={styles.secondaryButton}>
              Start onboarding
            </Link>
          </div>
        </header>

        <section className={styles.grid}>
          {tiles.map((t) => (
            <Link key={t.href} href={t.href} className={styles.card}>
              <div className={styles.cardTop}>
                {t.badge ? <span className={styles.badge}>{t.badge}</span> : null}
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>{t.title}</div>
                <div className={styles.cardDesc}>{t.description}</div>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.cardLinkText}>Open</span>
                <span className={styles.cardArrow} aria-hidden="true">
                  →
                </span>
              </div>
            </Link>
          ))}
        </section>

        <footer className={styles.footer}>
          Admin routes are restricted. If you see access denied, add your email to
          ADMIN_EMAIL_ALLOWLIST in .env.local.
        </footer>
      </div>
    </main>
  );
}
