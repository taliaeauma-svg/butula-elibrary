"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/Header";
import { useAuth } from "../../../lib/useAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://butula-elibrary-production.up.railway.app";

export default function BookDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [category, setCategory] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/books/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => {
        setBook(data);
        if (data.category_id) {
          fetch(`${API_URL}/categories`)
            .then((res) => res.json())
            .then((cats) => {
              const match = cats.find((c) => c.id === data.category_id);
              setCategory(match || null);
            });
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!book?.file_url) return;
    const filename = book.file_url.split("/").pop();
    const res = await fetch(`${API_URL}/download/${filename}`);
    const data = await res.json();
    window.open(data.download_url, "_blank");

    if (user) {
      fetch(`${API_URL}/downloads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, book_id: book.id }),
      }).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      <section className="max-w-3xl mx-auto px-6 py-14">
        <Link href="/#library" className="text-sm text-gray-400 dark:text-gray-500 hover:text-[#166534] dark:hover:text-green-400">
          ← Back to library
        </Link>

        {loading && (
          <div className="mt-8 text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
        )}

        {!loading && notFound && (
          <div className="mt-8 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg py-16 text-center text-gray-400 dark:text-gray-500">
            Resource not found.
          </div>
        )}

        {!loading && book && (
          <div className="mt-6 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-8 shadow-sm">
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center mb-5 text-[#166534] dark:text-green-400 font-bold text-xl">
              📘
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-gray-50 leading-snug">
              {book.title}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{book.author || "Unknown author"}</p>

            <div className="flex items-center gap-3 mt-4">
              {category && (
                <span className="inline-block text-xs bg-[#166534]/10 text-[#166534] dark:bg-green-500/10 dark:text-green-400 px-2 py-0.5 rounded-full">
                  {category.name}
                </span>
              )}
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Added {new Date(book.upload_date).toLocaleDateString()}
              </span>
            </div>

            {book.file_url ? (
              <button
                onClick={handleDownload}
                className="mt-8 bg-[#166534] text-white font-medium px-6 py-2.5 rounded-md hover:bg-[#14532d] dark:hover:bg-green-700 transition text-sm"
              >
                Download
              </button>
            ) : (
              <p className="mt-8 text-sm text-gray-400 dark:text-gray-500">No file attached to this resource.</p>
            )}
          </div>
        )}
      </section>

      <footer className="text-center text-gray-400 dark:text-gray-500 text-xs py-8 border-t border-gray-200 dark:border-gray-800">
        Okame Technical and Vocational College Library · Okame TVC Digital Resource Center
      </footer>
    </div>
  );
}
