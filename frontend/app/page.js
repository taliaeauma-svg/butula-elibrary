"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import { useAuth } from "../lib/useAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://butula-elibrary-production.up.railway.app";

export default function Home() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const { user, role } = useAuth();

  const fetchBooks = () =>
    fetch(`${API_URL}/books`).then((res) => {
      if (!res.ok) throw new Error("Failed to load books");
      return res.json();
    }).then(setBooks);

  const fetchCategories = () =>
    fetch(`${API_URL}/categories`).then((res) => {
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    }).then(setCategories);

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    Promise.all([fetchBooks(), fetchCategories()])
      .catch(() => setLoadError("Couldn't load the library right now. Please try refreshing the page."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSubmitting(true);

    try {
      let fileUrl = "";

      if (window.__pendingFile) {
        const formData = new FormData();
        formData.append("file", window.__pendingFile);
        const uploadRes = await fetch(`${API_URL}/upload`, {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.detail || "File upload failed");
        }
        const uploadData = await uploadRes.json();
        fileUrl = uploadData.file_url;
      }

      const bookRes = await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          category_id: categoryId ? parseInt(categoryId) : null,
          file_url: fileUrl,
        }),
      });
      if (!bookRes.ok) throw new Error("Failed to save the resource");

      setTitle("");
      setAuthor("");
      setCategoryId("");
      window.__pendingFile = null;
      setShowForm(false);
      fetchBooks();
    } catch (err) {
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setCategoryError("");

    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add category");
      setNewCategory("");
      fetchCategories();
    } catch (err) {
      setCategoryError(err.message || "Something went wrong. Please try again.");
    }
  };

  const handleDownload = async (book) => {
    if (!book.file_url) return;
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

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id === id);
    return cat ? cat.name : null;
  };

  const bookCountForCategory = (id) =>
    books.filter((b) => b.category_id === id).length;

  const handleSearchClick = () => {
    document.getElementById("library")?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredBooks = books
    .filter((b) =>
      filterCategory === "all" ? true : b.category_id === parseInt(filterCategory)
    )
    .filter((b) =>
      searchQuery.trim() === ""
        ? true
        : b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (b.author || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "author") return (a.author || "").localeCompare(b.author || "");
      return new Date(b.upload_date) - new Date(a.upload_date);
    });

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      {loadError && (
        <div className="bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm text-center py-2 px-6">
          {loadError}
        </div>
      )}

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-10 items-start">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-[#166534] dark:text-green-400 text-xs font-semibold uppercase tracking-wide mb-3">
              <span className="w-6 h-px bg-[#166534] dark:bg-green-400"></span>
              Est. 2026 · Digital Collection
            </div>
            <h1 className="text-4xl sm:text-5xl font-heading text-gray-900 dark:text-gray-50 leading-tight mb-4">
              The whole TVET library,<br />
              <span className="italic text-[#166534] dark:text-green-400">in one shelf.</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-lg">
              Browse textbooks, past papers, and teacher notes across every
              department. Download for revision — anywhere, any time.
            </p>

            <div className="flex gap-2 max-w-lg">
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
              />
              <button
                onClick={handleSearchClick}
                className="bg-[#166534] text-white font-medium px-5 py-2.5 rounded-md hover:bg-[#14532d] dark:hover:bg-green-700 transition text-sm"
              >
                Search
              </button>
            </div>

            {user && role === "admin" && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="mt-4 text-sm text-[#166534] dark:text-green-400 font-medium underline"
              >
                {showForm ? "Cancel adding resource" : "+ Add a new resource"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                Total Resources
              </div>
              <div className="text-2xl font-display font-bold text-gray-900 dark:text-gray-50 mt-1">
                {books.length}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">across {categories.length} categories</div>
            </div>
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                Categories
              </div>
              <div className="text-2xl font-display font-bold text-gray-900 dark:text-gray-50 mt-1">
                {categories.length}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">departments covered</div>
            </div>
          </div>
        </div>

        {/* Add resource form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-8 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6"
          >
            <h2 className="text-lg font-heading font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Add New Resource
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Author</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">File</label>
                <input
                  type="file"
                  onChange={(e) => (window.__pendingFile = e.target.files[0])}
                  className="w-full text-sm text-gray-600 dark:text-gray-300"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-[#166534] text-white font-medium px-6 py-2.5 rounded-md hover:bg-[#14532d] dark:hover:bg-green-700 transition text-sm w-full sm:w-auto disabled:opacity-50"
                >
                  {formSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {formError && (
              <p className="text-red-600 dark:text-red-400 text-sm mb-4">{formError}</p>
            )}

            <div className="border-t border-gray-200 dark:border-gray-800 pt-4 flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  New Category (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electrical Engineering"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCategory}
                className="border border-[#166534] text-[#166534] dark:border-green-500 dark:text-green-400 font-medium px-4 py-2 rounded-md hover:bg-[#166534] hover:text-white dark:hover:bg-green-500 dark:hover:text-black transition text-sm"
              >
                Add Category
              </button>
            </div>
            {categoryError && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{categoryError}</p>
            )}
          </form>
        )}
      </section>

      {/* Browse by category */}
      <section id="categories" className="max-w-6xl mx-auto px-6 pb-14">
        <div className="text-xs font-semibold text-[#166534] dark:text-green-400 uppercase tracking-wide mb-1">
          Collections
        </div>
        <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-gray-50 mb-6">
          Browse by category
        </h2>

        {loading ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm">No categories yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(String(cat.id))}
                className={`text-left border rounded-lg p-4 hover:border-[#166534] dark:hover:border-green-500 transition ${
                  filterCategory === String(cat.id)
                    ? "border-[#166534] bg-[#166534]/5 dark:border-green-500 dark:bg-green-500/10"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              >
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center mb-3 text-[#166534] dark:text-green-400 text-sm">
                  📁
                </div>
                <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-snug">
                  {cat.name}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {bookCountForCategory(cat.id)} resources
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Catalog */}
      <section id="library" className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-heading font-semibold text-gray-800 dark:text-gray-100">
            {filterCategory === "all" ? "All Resources" : getCategoryName(parseInt(filterCategory))}
          </h2>
          <div className="flex items-center gap-3">
            {filterCategory !== "all" && (
              <button
                onClick={() => setFilterCategory("all")}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-[#166534] dark:hover:text-green-400 underline"
              >
                Clear filter
              </button>
            )}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-800 rounded-full px-3 py-1 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
            >
              <option value="newest">Newest</option>
              <option value="title">Title A-Z</option>
              <option value="author">Author A-Z</option>
            </select>
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1 rounded-full">
              {filteredBooks.length} {filteredBooks.length === 1 ? "resource" : "resources"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg py-16 text-center text-gray-400 dark:text-gray-500">
            Loading...
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg py-16 text-center text-gray-400 dark:text-gray-500">
            No resources found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-[#166534]/30 dark:hover:border-green-500/30 transition"
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center mb-3 text-[#166534] dark:text-green-400 font-bold text-sm">
                  📘
                </div>
                <Link href={`/books/${book.id}`}>
                  <h3 className="font-heading font-semibold text-gray-800 dark:text-gray-100 leading-snug hover:text-[#166534] dark:hover:text-green-400 transition">
                    {book.title}
                  </h3>
                </Link>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {book.author || "Unknown author"}
                </p>
                {getCategoryName(book.category_id) && (
                  <span className="inline-block mt-2 text-xs bg-[#166534]/10 text-[#166534] dark:bg-green-500/10 dark:text-green-400 px-2 py-0.5 rounded-full">
                    {getCategoryName(book.category_id)}
                  </span>
                )}
                {book.file_url && (
                  <button
                    onClick={() => handleDownload(book)}
                    className="mt-3 w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    Download
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="text-center text-gray-400 dark:text-gray-500 text-xs py-8 border-t border-gray-200 dark:border-gray-800">
        Okame Technical and Vocational College Library · Okame TVC Digital Resource Center
      </footer>
    </div>
  );
}
