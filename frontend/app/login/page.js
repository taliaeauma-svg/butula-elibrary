"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../../lib/firebase";
import { authedFetch } from "../../lib/useAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://butula-elibrary-production.up.railway.app";
const DEFAULT_PASSWORD = "welcome2026";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    setError("");
    setResetSent(false);
    if (!trimmedEmail) {
      setError("Enter your email above first, then click \"Forgot password?\"");
      return;
    }
    setResetSending(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setResetSent(true);
    } catch (err) {
      setError("Couldn't send a reset email. Double-check the address and try again.");
    }
    setResetSending(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    try {
      const checkRes = await fetch(`${API_URL}/allowed-users/by-email/${trimmedEmail}`);
      if (!checkRes.ok) {
        setError("This email is not registered with the library.");
        setLoading(false);
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      } catch (signInErr) {
        if (password === DEFAULT_PASSWORD) {
          await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        } else {
          setError("Incorrect password.");
          setLoading(false);
          return;
        }
      }

      await authedFetch(`${API_URL}/students/sync`, { method: "POST" });

      router.push("/");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-6">
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-8 shadow-sm w-full max-w-sm">
        <h1 className="text-xl font-heading font-bold text-[#166534] dark:text-green-400 mb-1">
          Okame Technical and Vocational College Library
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Sign in with your registered email
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="welcome2026 (first login)"
              className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
            />
          </div>

          {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
          {resetSent && (
            <p className="text-[#166534] dark:text-green-400 text-sm">
              Password reset email sent — check your inbox.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#166534] text-white font-medium px-5 py-2.5 rounded-md hover:bg-[#14532d] dark:hover:bg-green-700 transition text-sm disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetSending}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-[#166534] dark:hover:text-green-400 text-left disabled:opacity-50"
          >
            {resetSending ? "Sending..." : "Forgot password?"}
          </button>
        </form>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          First time logging in? Use the password welcome2026, then change it
          in your account settings.
        </p>
      </div>
    </div>
  );
}