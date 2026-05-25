import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: 2025</p>
        <div className="prose text-gray-700 space-y-4">
          <p>
            By using Econnect you agree to these terms. This document will be updated with full
            terms before the public launch.
          </p>
          <p>
            For questions, contact{" "}
            <a href="mailto:support@econnect.et" className="text-blue-600 hover:underline">
              support@econnect.et
            </a>
            .
          </p>
        </div>
        <Link href="/" className="mt-8 inline-block text-blue-600 hover:underline text-sm">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
