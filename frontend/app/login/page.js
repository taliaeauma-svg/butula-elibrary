"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../lib/firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://butula-elibrary-production.up.railway.app";
const DEFAULT_PASSWORD = "welcome2026";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

      await fetch(`${API_URL}/students/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      router.push("/");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm w-full max-w-sm">
        <h1 className="text-xl font-serif font-bold text-[#6d1a2b] mb-1">
          Butula E-Library
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Sign in with your registered email
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6d1a2b]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6d1a2b]"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#6d1a2b] text-white font-medium px-5 py-2.5 rounded-md hover:bg-[#5a1523] transition text-sm disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-4">
          First time logging in? Use the password welcome2026, then change it
          in your account settings.
        </p>
      </div>
    </div>
  );
}