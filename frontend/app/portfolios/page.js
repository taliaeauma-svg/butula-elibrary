"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { useAuth, authedFetch } from "../../lib/useAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://butula-elibrary-production.up.railway.app";

export default function Portfolios() {
  const { user, role, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const isStaff = role === "admin" || role === "teacher";

  useEffect(() => {
    if (!user || !isStaff) return;
    const query = role === "teacher" ? "?role=student" : "";
    authedFetch(`${API_URL}/users${query}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load users");
        return res.json();
      })
      .then(setUsers)
      .catch(() => setLoadError("Couldn't load the student directory. Please try refreshing."))
      .finally(() => setLoading(false));
  }, [user, role]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header />
        <div className="max-w-3xl mx-auto px-6 py-14 text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user || !isStaff) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header />
        <div className="max-w-3xl mx-auto px-6 py-14 text-center">
          <p className="text-gray-500 dark:text-gray-400">You don&apos;t have access to this page.</p>
          <Link href="/" className="text-[#166534] dark:text-green-400 text-sm underline mt-2 inline-block">
            Back to library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      <section className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-gray-50 mb-8">Students</h1>

        {loadError && (
          <div className="mb-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
            {loadError}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">No users found.</p>
        ) : (
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((u) => (
              <Link
                key={u.id}
                href={`/portfolio/${u.email}`}
                className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition"
              >
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{u.name}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{u.email}</div>
                </div>
                <span className="text-xs bg-[#166534]/10 text-[#166534] dark:bg-green-500/10 dark:text-green-400 px-2 py-0.5 rounded-full">
                  {u.role}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
