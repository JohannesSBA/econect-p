import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h1>
        <p className="text-gray-600 mb-6">
          Password reset is not yet available. Please contact{" "}
          <a href="mailto:support@econnect.et" className="text-blue-600 hover:underline">
            support@econnect.et
          </a>{" "}
          for help.
        </p>
        <Link href="/auth/login" className="text-blue-600 hover:underline text-sm">
          Back to login
        </Link>
      </div>
    </div>
  );
}
