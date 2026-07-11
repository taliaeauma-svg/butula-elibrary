"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

const API_URL = "https://butula-elibrary-production.up.railway.app";

export default function Home() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const router = useRouter();

  const fetchBooks = () => {
    fetch(`${API_URL}/books`)
      .then((res) => res.json())
      .then((data) => setBooks(data));
  };

  const fetchCategories = () => {
    fetch(`${API_URL}/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data));
  };

  useEffect(() => {
    fetchBooks();
    fetchCategories();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetch(`${API_URL}/users/${currentUser.email}`)
          .then((res) => res.json())
          .then((data) => setRole(data.role))
          .catch(() => setRole(null));
      } else {
        setRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let fileUrl = "";

    if (window.__pendingFile) {
      const formData = new FormData();
      formData.append("file", window.__pendingFile);
      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      fileUrl = uploadData.file_url;
    }

    await fetch(`${API_URL}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        author,
        category_id: categoryId ? parseInt(categoryId) : null,
        file_url: fileUrl,
      }),
    });

    setTitle("");
    setAuthor("");
    setCategoryId("");
    window.__pendingFile = null;
    setShowForm(false);
    fetchBooks();
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    })
      .then((res) => res.json())
      .then(() => {
        setNewCategory("");
        fetchCategories();
      });
  };

  const handleDownload = async (fileUrl) => {
    if (!fileUrl) return;
    const filename = fileUrl.split("/").pop();
    const res = await fetch(`${API_URL}/download/${filename}`);
    const data = await res.json();
    window.open(data.download_url, "_blank");
  };

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id === id);
    return cat ? cat.name : null;
  };

  const bookCountForCategory = (id) =>
    books.filter((b) => b.category_id === id).length;

  const filteredBooks = books
    .filter((b) =>
      filterCategory === "all" ? true : b.category_id === parseInt(filterCategory)
    )
    .filter((b) =>
      searchQuery.trim() === ""
        ? true
        : b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (b.author || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#6d1a2b] rounded-md flex items-center justify-center text-white text-sm font-bold">
              📖
            </div>
            <div>
              <div className="font-serif font-bold text-gray-900 leading-tight">
                Butula E-Library
              </div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                TVET Digital Resource Center
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#library" className="hover:text-[#6d1a2b]">Library</a>
            <a href="#categories" className="hover:text-[#6d1a2b]">Categories</a>
            <a href="#help" className="hover:text-[#6d1a2b]">Help</a>
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
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                  {user.email[0].toUpperCase()}
                </div>
                <button
                  onClick={() => signOut(auth)}
                  className="text-xs text-gray-400 hover:text-[#6d1a2b] ml-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="border border-[#6d1a2b] text-[#6d1a2b] font-medium px-4 py-2 rounded-md hover:bg-[#6d1a2b] hover:text-white transition text-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-10 items-start">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-[#6d1a2b] text-xs font-semibold uppercase tracking-wide mb-3">
              <span className="w-6 h-px bg-[#6d1a2b]"></span>
              Est. 2026 · Digital Collection
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif text-gray-900 leading-tight mb-4">
              The whole TVET library,<br />
              <span className="italic text-[#6d1a2b]">in one shelf.</span>
            </h1>
            <p className="text-gray-500 mb-6 max-w-lg">
              Browse textbooks, past papers, and teacher notes across every
              department. Download for revision — anywhere, any time.
            </p>

            <div className="flex gap-2 max-w-lg">
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6d1a2b]"
              />
              <button className="bg-[#6d1a2b] text-white font-medium px-5 py-2.5 rounded-md hover:bg-[#5a1523] transition text-sm">
                Search
              </button>
            </div>

            {user && role === "admin" && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="mt-4 text-sm text-[#6d1a2b] font-medium underline"
              >
                {showForm ? "Cancel adding resource" : "+ Add a new resource"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                Total Resources
              </div>
              <div className="text-2xl font-serif font-bold text-gray-900 mt-1">
                {books.length}
              </div>
              <div className="text-xs text-gray-400">across {categories.length} categories</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                Categories
              </div>
              <div className="text-2xl font-serif font-bold text-gray-900 mt-1">
                {categories.length}
              </div>
              <div className="text-xs text-gray-400">departments covered</div>
            </div>
          </div>
        </div>

        {/* Add resource form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6"
          >
            <h2 className="text-lg font-serif font-semibold text-gray-800 mb-4">
              Add New Resource
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6d1a2b]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Author</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6d1a2b]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6d1a2b]"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">File</label>
                <input
                  type="file"
                  onChange={(e) => (window.__pendingFile = e.target.files[0])}
                  className="w-full text-sm text-gray-600"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="bg-[#6d1a2b] text-white font-medium px-6 py-2.5 rounded-md hover:bg-[#5a1523] transition text-sm w-full sm:w-auto"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  New Category (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electrical Engineering"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6d1a2b]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCategory}
                className="border border-[#6d1a2b] text-[#6d1a2b] font-medium px-4 py-2 rounded-md hover:bg-[#6d1a2b] hover:text-white transition text-sm"
              >
                Add Category
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Browse by category */}
      <section id="categories" className="max-w-6xl mx-auto px-6 pb-14">
        <div className="text-xs font-semibold text-[#6d1a2b] uppercase tracking-wide mb-1">
          Collections
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">
          Browse by category
        </h2>

        {categories.length === 0 ? (
          <p className="text-gray-400 text-sm">No categories yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(String(cat.id))}
                className={`text-left border rounded-lg p-4 hover:border-[#6d1a2b] transition ${
                  filterCategory === String(cat.id)
                    ? "border-[#6d1a2b] bg-[#6d1a2b]/5"
                    : "border-gray-200"
                }`}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center mb-3 text-[#6d1a2b] text-sm">
                  📁
                </div>
                <div className="font-semibold text-gray-800 text-sm leading-snug">
                  {cat.name}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {bookCountForCategory(cat.id)} resources
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Catalog */}
      <section id="library" className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-semibold text-gray-800">
            {filterCategory === "all" ? "All Resources" : getCategoryName(parseInt(filterCategory))}
          </h2>
          <div className="flex items-center gap-3">
            {filterCategory !== "all" && (
              <button
                onClick={() => setFilterCategory("all")}
                className="text-xs text-gray-400 hover:text-[#6d1a2b] underline"
              >
                Clear filter
              </button>
            )}
            <span className="text-sm text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
              {filteredBooks.length} {filteredBooks.length === 1 ? "resource" : "resources"}
            </span>
          </div>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg py-16 text-center text-gray-400">
            No resources found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-[#6d1a2b]/30 transition"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mb-3 text-[#6d1a2b] font-bold text-sm">
                  📘
                </div>
                <h3 className="font-serif font-semibold text-gray-800 leading-snug">
                  {book.title}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {book.author || "Unknown author"}
                </p>
                {getCategoryName(book.category_id) && (
                  <span className="inline-block mt-2 text-xs bg-[#6d1a2b]/10 text-[#6d1a2b] px-2 py-0.5 rounded-full">
                    {getCategoryName(book.category_id)}
                  </span>
                )}
                {book.file_url && (
                  <button
                    onClick={() => handleDownload(book.file_url)}
                    className="mt-3 w-full bg-gray-100 text-gray-700 text-sm font-medium py-2 rounded-md hover:bg-gray-200 transition"
                  >
                    Download
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="text-center text-gray-400 text-xs py-8 border-t border-gray-200">
        Butula E-Library · TVET Digital Resource Center
      </footer>
    </div>
  );
}