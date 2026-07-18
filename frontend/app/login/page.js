"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../lib/firebase";

const API_URL = "https://butula-elibrary-production.up.railway.app";

export default function Login() {
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const number = admissionNumber.trim();

    try {
      const checkRes = await fetch(`${API_URL}/allowed-users/${number}`);
      if (!checkRes.ok) {
        setError("This admission number is not registered with the library.");
        setLoading(false);
        return;
      }

      const allowedData = await checkRes.json();
      const email = allowedData.email || `${number}@butula.elibrary.local`;
      const password = number;

      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr) {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      await fetch(`${API_URL}/students/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admission_number: number }),
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
          Sign in with your admission number
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Admission Number
            </label>
            <input
              type="text"
              id="admissionNumber"
              name="admissionNumber"
              value={admissionNumber}
              onChange={(e) => setAdmissionNumber(e.target.value)}
              required
              placeholder="e.g. 0011"
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
          Only registered Butula TVET students and teachers can access this library.
        </p>
      </div>
    </div>
  );
}