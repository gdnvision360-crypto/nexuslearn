"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email"); // shown when user just registered

  const [status, setStatus] = useState<"verifying" | "success" | "error" | "pending">(
    token ? "verifying" : "pending"
  );
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    const verifyEmail = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error);
        }
      } catch {
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again.");
      }
    };

    verifyEmail();
  }, [token]);

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    setResendSuccess(false);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendSuccess(true);
      }
    } catch {
      // fail silently
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Verifying */}
          {status === "verifying" && (
            <>
              <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying your email...</h2>
              <p className="text-gray-500">Please wait a moment.</p>
            </>
          )}

          {/* Success */}
          {status === "success" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-500 mb-6">{message}</p>
              <Link
                href="/auth/signin"
                className="inline-block px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Sign in to NexusLearn
              </Link>
            </>
          )}

          {/* Error */}
          {status === "error" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-500 mb-6">{message}</p>
              <Link
                href="/auth/signin"
                className="inline-block px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all"
              >
                Back to Sign In
              </Link>
            </>
          )}

          {/* Pending — shown right after registration */}
          {status === "pending" && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-500 mb-2">
                We&apos;ve sent a verification link to:
              </p>
              {email && (
                <p className="font-semibold text-indigo-600 mb-6">{email}</p>
              )}
              <p className="text-gray-500 text-sm mb-6">
                Click the link in the email to verify your account. The link expires in 24 hours.
              </p>

              {email && (
                <div className="mb-6">
                  {resendSuccess ? (
                    <p className="text-sm text-green-600 font-medium">
                      Verification email sent! Check your inbox.
                    </p>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={resending}
                      className="text-sm text-indigo-600 hover:text-indigo-500 font-medium disabled:opacity-50"
                    >
                      {resending ? "Sending..." : "Didn't receive it? Resend verification email"}
                    </button>
                  )}
                </div>
              )}

              <Link
                href="/auth/signin"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
