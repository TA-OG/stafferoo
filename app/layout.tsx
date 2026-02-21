import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stafferoo",
  description: "Staff onboarding and bookings for early years settings",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
