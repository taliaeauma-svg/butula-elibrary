"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../lib/useAuth";
import { useTheme } from "../lib/useTheme";

export default function Header() {
  const { user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const navLinks = (
    <>
      <Link href="/#library" className="hover:text-[#166534] dark:hover:text-green-400">Library</Link>
      <Link href="/#categories" className="hover:text-[#166534] dark:hover:text-green-400">Categories</Link>
      <Link href="/#help" className="hover:text-[#166534] dark:hover:text-green-400">Help</Link>
      {user && (
        <Link href="/profile" className="hover:text-[#166534] dark:hover:text-green-400">Profile</Link>
      )}
      {user && role === "admin" && (
        <Link href="/admin" className="hover:text-[#166534] dark:hover:text-green-400">Admin</Link>
      )}
    </>
  );

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#166534] rounded-md flex items-center justify-center text-white text-sm font-bold">
            📖
          </div>
          <div>
            <div className="font-serif font-bold text-gray-900 dark:text-gray-50 leading-tight">
              Okame Technical and Vocational College Library
            </div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Okame TVC Digital Resource Center
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
          {navLinks}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            suppressHydrationWarning
            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:border-[#166534] dark:hover:border-green-500 transition text-sm"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-gray-400 dark:text-gray-500 leading-none">
                  {role === "admin" ? "Admin" : "Library User"}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-200 leading-tight">{user.email}</div>
              </div>
              <Link
                href="/profile"
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                {user.email[0].toUpperCase()}
              </Link>
              <button
                onClick={() => signOut(auth)}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-[#166534] dark:hover:text-green-400 ml-1"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="hidden md:inline-block border border-[#166534] text-[#166534] dark:border-green-500 dark:text-green-400 font-medium px-4 py-2 rounded-md hover:bg-[#166534] hover:text-white dark:hover:bg-green-500 dark:hover:text-black transition text-sm"
            >
              Sign In
            </button>
          )}

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            className="md:hidden w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 text-lg"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-col gap-4 text-sm text-gray-600 dark:text-gray-300">
          {navLinks}
          {user ? (
            <>
              <div className="text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-800">
                Signed in as <span className="text-gray-700 dark:text-gray-200">{user.email}</span>
              </div>
              <button
                onClick={() => signOut(auth)}
                className="text-left text-gray-400 dark:text-gray-500 hover:text-[#166534] dark:hover:text-green-400"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="text-left border border-[#166534] text-[#166534] dark:border-green-500 dark:text-green-400 font-medium px-4 py-2 rounded-md hover:bg-[#166534] hover:text-white dark:hover:bg-green-500 dark:hover:text-black transition w-fit"
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </header>
  );
}
