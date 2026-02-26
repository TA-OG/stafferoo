import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — Stafferoo",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <nav className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Terms of Use</span>
        </nav>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Use</h1>
            <p className="text-sm text-gray-500">Last updated: 22 February 2026</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">1. About Stafferoo</h2>
            <p className="text-gray-700 leading-relaxed">
              Stafferoo (&ldquo;the Platform&rdquo;) is operated by Stafferoo Ltd, a company
              registered in England and Wales. The Platform connects Ofsted-registered
              Early Years Childcare Businesses (&ldquo;Businesses&rdquo;) with qualified
              childcare staff (&ldquo;Staff&rdquo;) for temporary and emergency bookings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">2. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using the Platform you agree to be bound by these Terms of
              Use and our Privacy Policy. If you do not agree, you must not use the
              Platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">3. Eligibility</h2>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>
                <strong>Staff</strong> must be aged 18 or over, hold valid DBS clearance
                via the DBS Update Service, and provide accurate professional references.
              </li>
              <li>
                <strong>Businesses</strong> must hold a current Ofsted registration and
                operate within a postcode area enabled on the Platform.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">4. Account Registration</h2>
            <p className="text-gray-700 leading-relaxed">
              You must provide truthful, accurate, and complete information when creating
              an account. You are responsible for maintaining the confidentiality of your
              login credentials and for all activity that occurs under your account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">5. Verification and Onboarding</h2>
            <p className="text-gray-700 leading-relaxed">
              Staff profiles are subject to verification including DBS checks, reference
              validation, and document review. Businesses are subject to Ofsted registration
              verification. Stafferoo reserves the right to approve, reject, or suspend any
              account at its sole discretion.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">6. Bookings and Payments</h2>
            <p className="text-gray-700 leading-relaxed">
              Businesses post shift requests specifying dates, times, roles, and hourly
              rates. Staff may respond to available shifts. Once a booking is confirmed,
              both parties are expected to honour the arrangement. Cancellation policies
              apply as detailed in the booking confirmation.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Businesses are charged a platform subscription fee and an hourly usage rate
              as published on the Platform. All payments are processed securely. Stafferoo
              does not employ Staff directly; Staff are engaged as independent contractors
              or through their own arrangements with the Business.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">7. Data Protection</h2>
            <p className="text-gray-700 leading-relaxed">
              Stafferoo processes personal data in accordance with the UK General Data
              Protection Regulation (UK GDPR) and the Data Protection Act 2018. By using
              the Platform, you consent to the collection and processing of your data as
              described in our Privacy Policy. Sensitive data including DBS information
              and health declarations are stored securely and only shared with parties
              who have a legitimate need.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">8. Safeguarding</h2>
            <p className="text-gray-700 leading-relaxed">
              Stafferoo takes safeguarding seriously. All Staff must maintain valid
              enhanced DBS clearance. Stafferoo may share relevant information with
              Ofsted-registered Early Years Childcare Businesses and other regulatory
              bodies where required by law or safeguarding obligations.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">9. Prohibited Conduct</h2>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>Providing false or misleading information during registration</li>
              <li>Circumventing the Platform to arrange bookings directly</li>
              <li>Harassing, threatening, or discriminating against other users</li>
              <li>Attempting to access another user&rsquo;s account</li>
              <li>Using the Platform for any unlawful purpose</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">10. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              Stafferoo acts as an intermediary platform and does not guarantee the
              availability, suitability, or conduct of any Staff member or Business.
              To the fullest extent permitted by law, Stafferoo shall not be liable for
              any indirect, incidental, or consequential damages arising from the use of
              the Platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">11. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              Stafferoo may suspend or terminate your account at any time for breach of
              these Terms, fraudulent activity, or any other reason at its discretion.
              You may close your account at any time by contacting support.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">12. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              Stafferoo may update these Terms from time to time. Material changes will be
              communicated via email or an in-app notification. Continued use of the
              Platform after changes are published constitutes acceptance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">13. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by the laws of England and Wales. Any disputes
              shall be subject to the exclusive jurisdiction of the courts of England and
              Wales.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">14. In-Platform Communication</h2>
            <p className="text-gray-700 leading-relaxed">
              Stafferoo provides an in-platform messaging facility (&ldquo;the Chat&rdquo;) to allow
              Businesses and Staff to exchange job-related information. The following rules apply to
              all use of the Chat:
            </p>
            <ul className="list-disc pl-6 text-gray-700 leading-relaxed space-y-2">
              <li>
                <strong>Permitted use only.</strong> The Chat is provided solely to allow Businesses
                and Staff to clarify job-specific details for a shift that has been advertised on the
                Platform. It must not be used for any other purpose.
              </li>
              <li>
                <strong>No contact details.</strong> Sharing personal contact information —
                including phone numbers, personal or business email addresses, social media handles,
                messaging app usernames, or any other means of off-platform communication — is
                strictly prohibited.
              </li>
              <li>
                <strong>No off-platform arrangements.</strong> Using the Chat (or any other part of
                the Platform) to arrange bookings, payments, or working arrangements outside of
                Stafferoo is a serious breach of these Terms and may expose you to legal liability.
              </li>
              <li>
                <strong>Chat availability.</strong> A Chat thread becomes available once a Staff
                member has applied for a posted shift. The thread closes six (6) hours after the
                scheduled end time of the shift. Message history is preserved for thirty (30) days
                after the thread closes.
              </li>
              <li>
                <strong>Monitoring.</strong> Stafferoo reserves the right to review Chat messages
                for the purpose of investigating reported violations, safeguarding concerns, or
                platform security.
              </li>
              <li>
                <strong>Consequences of violation.</strong> Any user found to have shared contact
                details, arranged off-platform work, or otherwise misused the Chat will be subject
                to immediate suspension and may be permanently removed from the Platform without
                refund. Stafferoo may report serious violations to relevant regulatory bodies.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">15. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms, please contact us at{" "}
              <a
                href="mailto:support@stafferoo.app"
                className="text-[#bf5d9f] font-medium hover:underline"
              >
                support@stafferoo.app
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-[#bf5d9f] hover:underline"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
