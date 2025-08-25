// FILE: src/app/signup/page.tsx
"use client";

import { useMemo, useState } from "react";

type AccountType = "CURRENT" | "SAVINGS" | "INVESTMENT";

type Step1 = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  dob: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  acceptTerms: boolean;
  accountType: AccountType;
};

type BankingStep2 = {
  employmentStatus: string;
  incomeRange: string;
  expectedMonthlyDeposits: string;
  overdraftOptIn: boolean; // relevant mostly for CURRENT
  savingsGoal?: string; // relevant mostly for SAVINGS
};

type InvestStep2 = {
  riskTolerance: "LOW" | "MEDIUM" | "HIGH";
  experience: "NONE" | "<1Y" | "1-3Y" | "3-5Y" | "5Y+";
  horizon: "SHORT" | "MEDIUM" | "LONG";
  objective: "GROWTH" | "INCOME" | "BALANCED";
  knowledgeQuiz1: string;
  knowledgeQuiz2: string;
};

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);

  const [s1, setS1] = useState<Step1>({
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
    accountType: "CURRENT",
  });

  const [bank2, setBank2] = useState<BankingStep2>({
    employmentStatus: "",
    incomeRange: "",
    expectedMonthlyDeposits: "",
    overdraftOptIn: false,
    savingsGoal: "",
  });

  const [inv2, setInv2] = useState<InvestStep2>({
    riskTolerance: "MEDIUM",
    experience: "NONE",
    horizon: "MEDIUM",
    objective: "BALANCED",
    knowledgeQuiz1: "",
    knowledgeQuiz2: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isInvestment = s1.accountType === "INVESTMENT";
  const step1Valid = useMemo(() => {
    if (!s1.name || !s1.email || !s1.password || !s1.confirmPassword)
      return false;
    if (s1.password !== s1.confirmPassword) return false;
    if (!s1.acceptTerms) return false;
    return true;
  }, [s1]);

  function onChangeStep1(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked =
      (e.target as HTMLInputElement).checked !== undefined
        ? (e.target as HTMLInputElement).checked
        : undefined;
    setS1((p) => ({ ...p, [name]: type === "checkbox" ? !!checked : value }));
  }

  function onChangeBank(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked =
      (e.target as HTMLInputElement).checked !== undefined
        ? (e.target as HTMLInputElement).checked
        : undefined;
    setBank2((p) => ({
      ...p,
      [name]: type === "checkbox" ? !!checked : value,
    }));
  }

  function onChangeInv(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setInv2((p) => ({ ...p, [name]: value as any }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // We send everything; server can store “extra” answers in AuditLog.meta
      const payload = {
        ...s1,
        // Only one of these will be “active” based on account type
        bankingProfile: isInvestment ? undefined : bank2,
        investmentProfile: isInvestment ? inv2 : undefined,
      };

      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setLoading(false);

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Error creating account");
        return;
      }

      // If you added the smart router on /app, you can send them there instead of /pending
      window.location.href = "/pending";
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Network error");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Security header */}
      <div className="bg-[#00395d] text-white text-xs p-2 text-center">
        <div className="max-w-7xl mx-auto">
          🔒 Secure application | Your information is protected
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#00395d]">
          Open a Barclays Account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl">
        <form
          onSubmit={submit}
          className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"
        >
          {/* Stepper */}
          <div className="mb-6 flex items-center gap-3">
            <div
              className={`h-2 rounded-full transition-all ${
                step === 1 ? "bg-[#00395d] w-24" : "bg-[#00AEEF] w-24"
              }`}
            />
            <div
              className={`h-2 rounded-full transition-all ${
                step === 2 ? "bg-[#00395d] w-24" : "bg-gray-200 w-24"
              }`}
            />
            <div className="ml-auto text-sm text-gray-600">
              Step {step} of 2
            </div>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-[#00AEEF]/10 p-4 rounded-md">
                <h3 className="text-sm font-medium text-[#00395d]">
                  About you & login details
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  You must be 18+ and have a UK address and mobile phone.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Full name
                  </label>
                  <input
                    name="name"
                    required
                    value={s1.name}
                    onChange={onChangeStep1}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    required
                    value={s1.dob}
                    onChange={onChangeStep1}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    UK mobile
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    value={s1.phone}
                    onChange={onChangeStep1}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="07123 456789"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={s1.email}
                    onChange={onChangeStep1}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    name="address"
                    required
                    value={s1.address}
                    onChange={onChangeStep1}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    name="city"
                    required
                    value={s1.city}
                    onChange={onChangeStep1}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Postcode
                  </label>
                  <input
                    name="postcode"
                    required
                    value={s1.postcode}
                    onChange={onChangeStep1}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Postcode"
                  />
                </div>

                {/* Account type (drives step 2) */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Account type
                  </label>
                  <select
                    name="accountType"
                    value={s1.accountType}
                    onChange={onChangeStep1}
                    required
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="CURRENT">Current account</option>
                    <option value="SAVINGS">Savings account</option>
                    <option value="INVESTMENT">Investment account</option>
                  </select>
                </div>

                {/* Security */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={s1.password}
                    onChange={onChangeStep1}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Create a strong password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={s1.confirmPassword}
                    onChange={onChangeStep1}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Repeat your password"
                  />
                </div>

                <div className="sm:col-span-2 flex items-start">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={s1.acceptTerms}
                    onChange={onChangeStep1}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#00AEEF] focus:ring-[#00AEEF]"
                    required
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    I agree to the{" "}
                    <a href="#" className="text-[#00395d] underline">
                      Terms &amp; Conditions
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-[#00395d] underline">
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!step1Valid}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center rounded-md bg-[#00395d] px-4 py-2 text-white disabled:opacity-60"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Banking path */}
              {!isInvestment ? (
                <>
                  <div className="bg-[#00AEEF]/10 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-[#00395d]">
                      Account details
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      A few more details to help us set up your{" "}
                      {s1.accountType.toLowerCase()} account.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Employment status
                      </label>
                      <select
                        name="employmentStatus"
                        value={bank2.employmentStatus}
                        onChange={onChangeBank}
                        required
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="">Select…</option>
                        <option>Employed</option>
                        <option>Self-employed</option>
                        <option>Student</option>
                        <option>Unemployed</option>
                        <option>Retired</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Annual income (approx.)
                      </label>
                      <select
                        name="incomeRange"
                        value={bank2.incomeRange}
                        onChange={onChangeBank}
                        required
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="">Select…</option>
                        <option>Under £20,000</option>
                        <option>£20,000–£40,000</option>
                        <option>£40,000–£60,000</option>
                        <option>£60,000–£100,000</option>
                        <option>£100,000+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Expected monthly deposits
                      </label>
                      <select
                        name="expectedMonthlyDeposits"
                        value={bank2.expectedMonthlyDeposits}
                        onChange={onChangeBank}
                        required
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="">Select…</option>
                        <option>Under £500</option>
                        <option>£500–£1,500</option>
                        <option>£1,500–£3,000</option>
                        <option>£3,000+</option>
                      </select>
                    </div>

                    {/* Overdraft (mostly current) */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="overdraftOptIn"
                        checked={bank2.overdraftOptIn}
                        onChange={onChangeBank}
                        className="h-4 w-4 rounded border-gray-300 text-[#00AEEF] focus:ring-[#00AEEF]"
                      />
                      <label className="text-sm text-gray-700">
                        Apply for an overdraft (subject to status)
                      </label>
                    </div>

                    {/* Savings goal (only shows for SAVINGS but harmless otherwise) */}
                    {s1.accountType === "SAVINGS" && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Savings goal (optional)
                        </label>
                        <input
                          name="savingsGoal"
                          value={bank2.savingsGoal}
                          onChange={onChangeBank}
                          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                          placeholder="e.g. Holiday fund, House deposit"
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Investment path
                <>
                  <div className="bg-[#00AEEF]/10 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-[#00395d]">
                      Investment profile
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      A few questions to understand your goals and risk profile.
                      This helps display suitable content in your Investments
                      hub.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Risk tolerance
                      </label>
                      <select
                        name="riskTolerance"
                        value={inv2.riskTolerance}
                        onChange={onChangeInv}
                        required
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Experience
                      </label>
                      <select
                        name="experience"
                        value={inv2.experience}
                        onChange={onChangeInv}
                        required
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="NONE">None</option>
                        <option value="<1Y">Under 1 year</option>
                        <option value="1-3Y">1–3 years</option>
                        <option value="3-5Y">3–5 years</option>
                        <option value="5Y+">5+ years</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Time horizon
                      </label>
                      <select
                        name="horizon"
                        value={inv2.horizon}
                        onChange={onChangeInv}
                        required
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="SHORT">Short (0–3 years)</option>
                        <option value="MEDIUM">Medium (3–7 years)</option>
                        <option value="LONG">Long (7+ years)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Primary objective
                      </label>
                      <select
                        name="objective"
                        value={inv2.objective}
                        onChange={onChangeInv}
                        required
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="GROWTH">Growth</option>
                        <option value="INCOME">Income</option>
                        <option value="BALANCED">Balanced</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Understanding: what is diversification?
                      </label>
                      <input
                        name="knowledgeQuiz1"
                        value={inv2.knowledgeQuiz1}
                        onChange={onChangeInv}
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="Answer in your own words"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Understanding: can investments go down as well as up?
                      </label>
                      <input
                        name="knowledgeQuiz2"
                        value={inv2.knowledgeQuiz2}
                        onChange={onChangeInv}
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="Answer in your own words"
                      />
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center rounded-md border px-4 py-2"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-md bg-[#00395d] px-4 py-2 text-white disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeOpacity="0.3"
                          strokeWidth="4"
                        />
                        <path
                          d="M22 12a10 10 0 0 1-10 10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                      </svg>
                      Creating…
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
