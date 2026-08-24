"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import Header from "../../components/Header";
import { auth } from "../../lib/firebase";
import { useAuth, authedFetch } from "../../lib/useAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://butula-elibrary-production.up.railway.app";

export default function Profile() {
  const { user, role, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [downloads, setDownloads] = useState([]);
  const [downloadsLoading, setDownloadsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const router = useRouter();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }

    setChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError("Current password is incorrect.");
    }
    setChangingPassword(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    authedFetch(`${API_URL}/users/${user.email}`)
      .then((res) => res.json())
      .then(setProfile)
      .catch(() => setProfile(null));

    authedFetch(`${API_URL}/downloads/${user.email}`)
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
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-gray-50 mb-6">My Profile</h1>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 text-lg">
              {user.email[0].toUpperCase()}
            </div>
            <div>
              <div className="font-heading font-semibold text-gray-900 dark:text-gray-50">
                {profile?.name || user.email}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Role</div>
              <div className="text-gray-700 dark:text-gray-200 mt-0.5">{role === "admin" ? "Admin" : role === "teacher" ? "Teacher" : "Library User"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Department</div>
              <div className="text-gray-700 dark:text-gray-200 mt-0.5">{profile?.department || "Not set"}</div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-10">
          <h2 className="text-lg font-heading font-semibold text-gray-800 dark:text-gray-100 mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-3 max-w-xs">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
              />
            </div>
            {passwordError && (
              <p className="text-red-600 dark:text-red-400 text-sm">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-[#166534] dark:text-green-400 text-sm">Password updated successfully.</p>
            )}
            <button
              type="submit"
              disabled={changingPassword}
              className="self-start bg-[#166534] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#14532d] dark:hover:bg-green-700 transition disabled:opacity-50"
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        <h2 className="text-lg font-heading font-semibold text-gray-800 dark:text-gray-100 mb-4">Download History</h2>

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
