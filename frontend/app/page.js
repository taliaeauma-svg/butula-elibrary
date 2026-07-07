"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Home() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [file, setFile] = useState(null);
  const router = useRouter();
  
  const handleDownload = async (fileUrl) => {
    if (!fileUrl) return;
    const filename = fileUrl.split("/").pop();

    const res = await fetch(`http://127.0.0.1:8000/download/${filename}`);
    const data = await res.json();
    window.open(data.download_url, "_blank");
  };

  const fetchBooks = () => {
    fetch("http://127.0.0.1:8000/books")
      .then((res) => res.json())
      .then((data) => setBooks(data));
  };

  const fetchCategories = () => {
    fetch("http://127.0.0.1:8000/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data));
  };

  useEffect(() => {
    fetchBooks();
    fetchCategories();

 const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetch(`http://127.0.0.1:8000/users/${currentUser.email}`)
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

    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      fileUrl = uploadData.file_url;
    }

    await fetch("http://127.0.0.1:8000/books", {
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
    setFile(null);
    setShowForm(false);
    fetchBooks();
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    fetch("http://127.0.0.1:8000/categories", {
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

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id === id);
    return cat ? cat.name : null;
  };

  const filteredBooks =
    filterCategory === "all"
      ? books
      : books.filter((b) => b.category_id === parseInt(filterCategory));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#6d1a2b] tracking-wide">
              BUTULA E-LIBRARY
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              TVET Digital Resource Center
            </p>
          </div>
          <div className="flex items-center gap-3">
            {role === "admin" && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-[#6d1a2b] text-white font-semibold px-5 py-2.5 rounded-md hover:bg-[#5a1523] transition text-sm"
              >
                {showForm ? "Cancel" : "+ Add Resource"}
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 hidden sm:inline">
                  {user.email}
                </span>
                <button
                  onClick={() => signOut(auth)}
                  className="border border-gray-300 text-gray-600 font-medium px-4 py-2.5 rounded-md hover:bg-gray-50 transition text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="border border-[#6d1a2b] text-[#6d1a2b] font-medium px-4 py-2.5 rounded-md hover:bg-[#6d1a2b] hover:text-white transition text-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
        <div className="h-1 bg-[#6d1a2b]"></div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Add Book Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm"
          >
            <h2 className="text-lg font-serif font-semibold text-gray-800 mb-4">
              Add New Resource
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6d1a2b]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6d1a2b]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6d1a2b] bg-white"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
<div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  File
                </label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
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

            {/* Quick add category */}
            <div className="border-t border-gray-100 pt-4 flex items-end gap-3">
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

        {/* Catalog header + filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h2 className="text-lg font-serif font-semibold text-gray-800">
            Catalog
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6d1a2b]"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full whitespace-nowrap">
              {filteredBooks.length}{" "}
              {filteredBooks.length === 1 ? "resource" : "resources"}
            </span>
          </div>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-lg py-16 text-center text-gray-400">
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
      </div>

      <footer className="text-center text-gray-400 text-xs py-8 border-t border-gray-200 mt-8">
        Butula E-Library · TVET Digital Resource Center
      </footer>
    </div>
  );
}