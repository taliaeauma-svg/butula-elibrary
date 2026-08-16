"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../lib/useAuth";

export default function Header() {
  const { user, role } = useAuth();
  const router = useRouter();

  return (
    <header className="border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#166534] rounded-md flex items-center justify-center text-white text-sm font-bold">
            📖
          </div>
          <div>
            <div className="font-serif font-bold text-gray-900 leading-tight">
              Okame Technical and Vocational College Library
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">
              Okame TVC Digital Resource Center
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <Link href="/#library" className="hover:text-[#166534]">Library</Link>
          <Link href="/#categories" className="hover:text-[#166534]">Categories</Link>
          <Link href="/#help" className="hover:text-[#166534]">Help</Link>
          {user && (
            <Link href="/profile" className="hover:text-[#166534]">Profile</Link>
          )}
          {user && role === "admin" && (
            <Link href="/admin" className="hover:text-[#166534]">Admin</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-gray-400 leading-none">
                  {role === "admin" ? "Admin" : "Library User"}
                </div>
                <div className="text-sm text-gray-700 leading-tight">{user.email}</div>
              </div>
              <Link
                href="/profile"
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs hover:bg-gray-300 transition"
              >
                {user.email[0].toUpperCase()}
              </Link>
              <button
                onClick={() => signOut(auth)}
                className="text-xs text-gray-400 hover:text-[#166534] ml-1"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="border border-[#166534] text-[#166534] font-medium px-4 py-2 rounded-md hover:bg-[#166534] hover:text-white transition text-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
