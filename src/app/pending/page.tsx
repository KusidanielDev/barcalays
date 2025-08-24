// FILE: src/app/pending/page.tsx
export const metadata = { title: "Account pending | Barclays" };

export default function PendingPage() {
  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="text-2xl font-bold text-barclays-navy">
        Your account is pending
      </h1>

      <p className="mt-3 text-gray-700">
        Thanks for signing up. A banker will review your details shortly. You
        will be able to sign in once your account is approved.
      </p>

      <p className="mt-3 text-gray-700">
        If you need help,{" "}
        <a
          href="mailto:PUT_SUPPORT_EMAIL_HERE"
          className="text-barclays-blue underline underline-offset-2"
        >
          contact support
        </a>
        .
      </p>

      <div className="mt-6">
        <a href="/login" className="btn-secondary">
          Back to login
        </a>
      </div>
    </div>
  );
}
