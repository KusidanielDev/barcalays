import Link from "next/link";
export default function Onboarding() {
  return (
    <div className="container py-10 max-w-2xl">
      <h1 className="text-2xl font-bold text-barclays-navy">Welcome</h1>
      <p className="text-gray-700 mt-2">
        This short guide helps you set up your banking.
      </p>
      <ol className="mt-4 list-decimal list-inside space-y-2">
        <li>
          Create your account on the{" "}
          <Link href="/signup" className="text-barclays-blue underline">
            sign-up page
          </Link>
          .
        </li>
        <li>
          Log in, then visit{" "}
          <Link href="/app/payees" className="text-barclays-blue underline">
            Payees
          </Link>{" "}
          to add a friend.
        </li>
        <li>Try an internal transfer or an external payment with OTP.</li>
      </ol>
      <Link href="/login" className="btn-primary mt-6 inline-block">
        Get started
      </Link>
    </div>
  );
}
