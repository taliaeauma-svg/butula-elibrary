"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import { useAuth } from "../../lib/useAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://butula-elibrary-production.up.railway.app";

export default function Profile() {
  const { user, role, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [downloads, setDownloads] = useState([]);
  const [downloadsLoading, setDownloadsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/users/${user.email}`)
      .then((res) => res.json())
      .then(setProfile)
      .catch(() => setProfile(null));

    fetch(`${API_URL}/downloads/${user.email}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setDownloads)
      .catch(() => setDownloads([]))
      .finally(() => setDownloadsLoading(false));
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header />
        <div className="max-w-3xl mx-auto px-6 py-14 text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      <section className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-50 mb-6">My Profile</h1>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 text-lg">
              {user.email[0].toUpperCase()}
            </div>
            <div>
              <div className="font-serif font-semibold text-gray-900 dark:text-gray-50">
                {profile?.name || user.email}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Role</div>
              <div className="text-gray-700 dark:text-gray-200 mt-0.5">{role === "admin" ? "Admin" : "Library User"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Department</div>
              <div className="text-gray-700 dark:text-gray-200 mt-0.5">{profile?.department || "Not set"}</div>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-serif font-semibold text-gray-800 dark:text-gray-100 mb-4">Download History</h2>

        {downloadsLoading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading...</p>
        ) : downloads.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
            No downloads yet.
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
            {downloads.map((d) => (
              <Link
                key={d.id}
                href={`/books/${d.book_id}`}
                className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition"
              >
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{d.title}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{d.author || "Unknown author"}</div>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(d.downloaded_at).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
