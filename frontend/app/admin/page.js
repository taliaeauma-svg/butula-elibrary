"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { useAuth } from "../../lib/useAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://butula-elibrary-production.up.railway.app";

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryEditName, setCategoryEditName] = useState("");
  const [editingBookId, setEditingBookId] = useState(null);
  const [bookEdit, setBookEdit] = useState({ title: "", author: "", category_id: "", file_url: "" });
  const [csvFile, setCsvFile] = useState(null);
  const [csvResult, setCsvResult] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);

  const fetchCategories = () => {
    fetch(`${API_URL}/categories`)
      .then((res) => res.json())
      .then(setCategories);
  };

  const fetchBooks = () => {
    fetch(`${API_URL}/books`)
      .then((res) => res.json())
      .then(setBooks);
  };

  useEffect(() => {
    fetchCategories();
    fetchBooks();
  }, []);

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || null;

  const startEditCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setCategoryEditName(cat.name);
  };

  const saveCategory = async (id) => {
    await fetch(`${API_URL}/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: categoryEditName }),
    });
    setEditingCategoryId(null);
    fetchCategories();
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category? Books in it will become uncategorized.")) return;
    await fetch(`${API_URL}/categories/${id}`, { method: "DELETE" });
    fetchCategories();
    fetchBooks();
  };

  const startEditBook = (book) => {
    setEditingBookId(book.id);
    setBookEdit({
      title: book.title,
      author: book.author || "",
      category_id: book.category_id || "",
      file_url: book.file_url || "",
    });
  };

  const handleReplaceFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
    const data = await res.json();
    setBookEdit((prev) => ({ ...prev, file_url: data.file_url }));
  };

  const saveBook = async (id) => {
    await fetch(`${API_URL}/books/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: bookEdit.title,
        author: bookEdit.author,
        category_id: bookEdit.category_id ? parseInt(bookEdit.category_id) : null,
        file_url: bookEdit.file_url,
      }),
    });
    setEditingBookId(null);
    fetchBooks();
  };

  const deleteBook = async (id) => {
    if (!window.confirm("Delete this book? This cannot be undone.")) return;
    await fetch(`${API_URL}/books/${id}`, { method: "DELETE" });
    fetchBooks();
  };

  const uploadCsv = async () => {
    if (!csvFile) return;
    setCsvUploading(true);
    setCsvResult(null);
    const formData = new FormData();
    formData.append("file", csvFile);
    const res = await fetch(`${API_URL}/allowed-users/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setCsvResult(data);
    setCsvUploading(false);
    setCsvFile(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-14 text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user || role !== "admin") {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-14 text-center">
          <p className="text-gray-500">You don&apos;t have access to this page.</p>
          <Link href="/" className="text-[#6d1a2b] text-sm underline mt-2 inline-block">
            Back to library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="max-w-4xl mx-auto px-6 py-14">
        <h1 className="text-2xl font-serif font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-lg font-serif font-semibold text-gray-800 mb-4">Categories</h2>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            {categories.length === 0 && (
              <p className="p-4 text-sm text-gray-400">No categories yet.</p>
            )}
            {categories.map((cat) => (
              <div key={cat.id} className="p-3 flex items-center justify-between gap-3">
                {editingCategoryId === cat.id ? (
                  <>
                    <input
                      value={categoryEditName}
                      onChange={(e) => setCategoryEditName(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6d1a2b]"
                    />
                    <button
                      onClick={() => saveCategory(cat.id)}
                      className="text-xs bg-[#6d1a2b] text-white px-3 py-1.5 rounded-md"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCategoryId(null)}
                      className="text-xs text-gray-400"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-700">{cat.name}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => startEditCategory(cat)}
                        className="text-xs text-gray-500 hover:text-[#6d1a2b]"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Books */}
        <div className="mb-12">
          <h2 className="text-lg font-serif font-semibold text-gray-800 mb-4">Books</h2>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            {books.length === 0 && (
              <p className="p-4 text-sm text-gray-400">No books yet.</p>
            )}
            {books.map((book) => (
              <div key={book.id} className="p-4">
                {editingBookId === book.id ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        value={bookEdit.title}
                        onChange={(e) => setBookEdit((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Title"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6d1a2b]"
                      />
                      <input
                        value={bookEdit.author}
                        onChange={(e) => setBookEdit((p) => ({ ...p, author: e.target.value }))}
                        placeholder="Author"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6d1a2b]"
                      />
                      <select
                        value={bookEdit.category_id}
                        onChange={(e) => setBookEdit((p) => ({ ...p, category_id: e.target.value }))}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6d1a2b]"
                      >
                        <option value="">No category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-500">
                        Replace file:
                        <input type="file" onChange={handleReplaceFile} className="ml-2 text-xs" />
                      </label>
                      {bookEdit.file_url && (
                        <span className="text-xs text-gray-400 truncate">
                          current: {bookEdit.file_url.split("/").pop()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => saveBook(book.id)}
                        className="text-xs bg-[#6d1a2b] text-white px-3 py-1.5 rounded-md"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingBookId(null)}
                        className="text-xs text-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{book.title}</div>
                      <div className="text-xs text-gray-400">
                        {book.author || "Unknown author"}
                        {getCategoryName(book.category_id) && ` · ${getCategoryName(book.category_id)}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => startEditBook(book)}
                        className="text-xs text-gray-500 hover:text-[#6d1a2b]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteBook(book.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Allowed users CSV upload */}
        <div>
          <h2 className="text-lg font-serif font-semibold text-gray-800 mb-4">
            Bulk-upload Allowed Users
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            CSV columns: admission_number, email, name, role
          </p>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files[0])}
              className="text-sm text-gray-600"
            />
            <button
              onClick={uploadCsv}
              disabled={!csvFile || csvUploading}
              className="bg-[#6d1a2b] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#5a1523] transition disabled:opacity-50"
            >
              {csvUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          {csvResult && (
            <p className="text-sm text-gray-500 mt-2">Added {csvResult.added} new user(s).</p>
          )}
        </div>
      </section>
    </div>
  );
}
