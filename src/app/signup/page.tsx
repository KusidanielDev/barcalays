// FILE: src/app/signup/page.tsx
"use client";
import { useState } from "react";

type AccountType = "CURRENT" | "SAVINGS" | "INVESTMENT";

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    dob: "",
    phone: "",
    address: "",
    city: "",
    postcode: "",
    acceptTerms: false,
  });
  const [accountType, setAccountType] = useState<AccountType>("CURRENT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const goNext = () => {
    setError(null);
    // Basic validation for step 1
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError("Please complete all required fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!form.acceptTerms) {
      setError("You must accept the Terms & Conditions");
      return;
    }
    setStep(2);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // send everything PLUS the chosen accountType
      body: JSON.stringify({ ...form, accountType }),
    });

    setLoading(false);

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Error creating account");
      return;
    }

    // success
    window.location.href = "/pending";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Security header */}
      <div className="bg-barclays-navy text-white text-xs p-2 text-center">
        <div className="max-w-7xl mx-auto">
          🔒 Secure application | Your information is protected
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        {/* Barclays Logo */}
        <div className="flex justify-center">
          <div className="rounded-full bg-barclays-blue p-3">
            <svg
              className="h-12 w-12 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 2.5L20 7l-8 4-8-4 8-4.5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        <h2 className="mt-6 text-center text-3xl font-extrabold text-barclays-navy">
          Open a Barclays Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-medium text-barclays-blue hover:text-barclays-dark-blue"
          >
            Log in here
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 text-sm mb-6">
            <div
              className={`px-3 py-1 rounded-full ${
                step === 1 ? "bg-barclays-blue text-white" : "bg-gray-100"
              }`}
            >
              1. Your details
            </div>
            <div className="text-gray-400">→</div>
            <div
              className={`px-3 py-1 rounded-full ${
                step === 2 ? "bg-barclays-blue text-white" : "bg-gray-100"
              }`}
            >
              2. Account type
            </div>
          </div>

          {step === 1 ? (
            <>
              <div className="bg-barclays-blue/10 p-4 rounded-md mb-6">
                <h3 className="text-sm font-medium text-barclays-navy">
                  Eligibility Requirements
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  To open an account, you must be 18+ and have a UK address and
                  mobile phone.
                </p>
              </div>

              {/* STEP 1: personal info (no form submit here) */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Personal Information */}
                <div className="sm:col-span-2">
                  <h3 className="text-lg font-medium text-barclays-navy border-b pb-2">
                    Personal Information
                  </h3>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-barclays-blue focus:border-barclays-blue sm:text-sm"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dob"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Date of Birth
                  </label>
                  <input
                    id="dob"
                    name="dob"
                    type="date"
                    required
                    value={form.dob}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-barclays-blue focus:border-barclays-blue sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    UK Mobile Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-barclays-blue focus:border-barclays-blue sm:text-sm"
                    placeholder="e.g., 07123456789"
                  />
                </div>

                {/* Contact Information */}
                <div className="sm:col-span-2 mt-4">
                  <h3 className="text-lg font-medium text-barclays-navy border-b pb-2">
                    Contact Information
                  </h3>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-barclays-blue focus:border-barclays-blue sm:text-sm"
                    placeholder="Enter your email address"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Address
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    value={form.address}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-barclays-blue focus:border-barclays-blue sm:text-sm"
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700"
                  >
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={form.city}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-barclays-blue focus:border-barclays-blue sm:text-sm"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label
                    htmlFor="postcode"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Postcode
                  </label>
                  <input
                    id="postcode"
                    name="postcode"
                    type="text"
                    required
                    value={form.postcode}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-barclays-blue focus:border-barclays-blue sm:text-sm"
                    placeholder="Postcode"
                  />
                </div>

                {/* Account Security */}
                <div className="sm:col-span-2 mt-4">
                  <h3 className="text-lg font-medium text-barclays-navy border-b pb-2">
                    Account Security
                  </h3>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-barclays-blue focus:border-barclays-blue sm:text-sm"
                    placeholder="Create a password"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters with a number and special
                    character
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-barclays-blue focus:border-barclays-blue sm:text-sm"
                    placeholder="Confirm your password"
                  />
                </div>

                {/* Terms and Conditions */}
                <div className="sm:col-span-2 flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="acceptTerms"
                      name="acceptTerms"
                      type="checkbox"
                      required
                      checked={form.acceptTerms}
                      onChange={handleChange}
                      className="focus:ring-barclays-blue h-4 w-4 text-barclays-blue border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="acceptTerms"
                      className="font-medium text-gray-700"
                    >
                      I agree to the{" "}
                      <a
                        href="#"
                        className="text-barclays-blue hover:text-barclays-dark-blue"
                      >
                        Terms & Conditions
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className="text-barclays-blue hover:text-barclays-dark-blue"
                      >
                        Privacy Policy
                      </a>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      You agree to our terms and acknowledge our privacy policy.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4 mt-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Application error
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <button
                  type="button"
                  onClick={goNext}
                  className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-barclays-blue hover:bg-barclays-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-barclays-blue transition-colors duration-200"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            // STEP 2: account type + final submit form
            <form className="space-y-6" onSubmit={submit}>
              <h3 className="text-lg font-medium text-barclays-navy border-b pb-2">
                Choose your account type
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(["CURRENT", "SAVINGS", "INVESTMENT"] as AccountType[]).map(
                  (t) => (
                    <label
                      key={t}
                      className={`cursor-pointer rounded-lg border p-4 hover:bg-gray-50 ${
                        accountType === t ? "ring-2 ring-barclays-blue" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="accountType"
                          className="h-4 w-4"
                          checked={accountType === t}
                          onChange={() => setAccountType(t)}
                        />
                        <span className="font-medium">{t}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {t === "CURRENT" && "Everyday banking with debit card."}
                        {t === "SAVINGS" && "Earn interest on your savings."}
                        {t === "INVESTMENT" &&
                          "Invest in shares & funds (demo)."}
                      </p>
                    </label>
                  )
                )}
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Application error
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50 text-sm"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-barclays-blue hover:bg-barclays-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-barclays-blue transition-colors duration-200"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating Account...
                    </div>
                  ) : (
                    "Create account"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Security footer */}
      <div className="mt-8 text-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs text-gray-500">
          © 2025 Barclays Bank UK PLC. Authorised by the Prudential Regulation
          Authority and regulated by the Financial Conduct Authority and the
          Prudential Regulation Authority (Financial Services Register No.
          122702).
          <br />
          <strong>Note:</strong> This is a demo application for educational
          purposes only.
        </p>
      </div>
    </div>
  );
}
