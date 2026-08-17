"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../../components/Header";
import { useAuth, authedFetch } from "../../../lib/useAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://butula-elibrary-production.up.railway.app";

const VIDEO_EXTENSIONS = ["mp4", "webm", "ogg", "mov", "m4v"];

function isVideoFile(fileUrl) {
  if (!fileUrl) return false;
  const ext = fileUrl.split(".").pop().toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

export default function Portfolio() {
  const { email } = useParams();
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [actionError, setActionError] = useState("");

  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [savingResume, setSavingResume] = useState(false);

  const [newType, setNewType] = useState("project");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingItemId, setEditingItemId] = useState(null);
  const [itemEdit, setItemEdit] = useState({ type: "project", title: "", description: "", file_url: "" });
  const [itemFileReplacing, setItemFileReplacing] = useState(false);
  const [videoUrls, setVideoUrls] = useState({});

  const decodedEmail = decodeURIComponent(email || "");
  const isOwner = user && user.email === decodedEmail;
  const isStaff = role === "admin" || role === "teacher";

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const fetchPortfolio = () => {
    authedFetch(`${API_URL}/portfolio/${decodedEmail}`)
      .then((res) => {
        if (res.status === 403) {
          setNotAuthorized(true);
          return null;
        }
        if (!res.ok) throw new Error("Failed to load portfolio");
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setPortfolio(data);
        setBio(data.bio || "");
        setSkills(data.skills || "");
      })
      .catch(() => setActionError("Couldn't load this portfolio. Please try refreshing."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || !decodedEmail) return;
    fetchPortfolio();
  }, [user, decodedEmail]);

  useEffect(() => {
    (portfolio?.items || [])
      .filter((item) => isVideoFile(item.file_url) && !(item.id in videoUrls))
      .forEach((item) => {
        authedFetch(`${API_URL}/portfolio/download/${item.id}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) setVideoUrls((prev) => ({ ...prev, [item.id]: data.download_url }));
          })
          .catch(() => {});
      });
  }, [portfolio]);

  const saveResume = async () => {
    setActionError("");
    setSavingResume(true);
    try {
      const res = await authedFetch(`${API_URL}/users/${decodedEmail}/resume`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, skills }),
      });
      if (!res.ok) throw new Error("Failed to save resume");
    } catch (err) {
      setActionError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSavingResume(false);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setActionError("");
    setAdding(true);
    try {
      let fileUrl = "";
      if (window.__pendingPortfolioFile) {
        const formData = new FormData();
        formData.append("file", window.__pendingPortfolioFile);
        const uploadRes = await authedFetch(`${API_URL}/upload`, { method: "POST", body: formData });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.detail || "File upload failed");
        }
        const uploadData = await uploadRes.json();
        fileUrl = uploadData.file_url;
      }

      const res = await authedFetch(`${API_URL}/portfolio/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType, title, description: newDescription.trim(), file_url: fileUrl }),
      });
      if (!res.ok) throw new Error("Failed to add item");

      setNewTitle("");
      setNewDescription("");
      window.__pendingPortfolioFile = null;
      fetchPortfolio();
    } catch (err) {
      setActionError(err.message || "Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const startEditItem = (item) => {
    setEditingItemId(item.id);
    setItemEdit({
      type: item.type,
      title: item.title,
      description: item.description || "",
      file_url: item.file_url || "",
    });
    setActionError("");
  };

  const handleReplaceItemFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setActionError("");
    setItemFileReplacing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await authedFetch(`${API_URL}/upload`, { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "File upload failed");
      }
      const data = await res.json();
      setItemEdit((prev) => ({ ...prev, file_url: data.file_url }));
    } catch (err) {
      setActionError(err.message || "Something went wrong. Please try again.");
    } finally {
      setItemFileReplacing(false);
    }
  };

  const saveItem = async (id) => {
    const title = itemEdit.title.trim();
    if (!title) return;
    setActionError("");
    try {
      const res = await authedFetch(`${API_URL}/portfolio/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...itemEdit, title }),
      });
      if (!res.ok) throw new Error("Failed to save item");
      setEditingItemId(null);
      fetchPortfolio();
    } catch (err) {
      setActionError(err.message || "Something went wrong. Please try again.");
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    setActionError("");
    try {
      const res = await authedFetch(`${API_URL}/portfolio/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
      fetchPortfolio();
    } catch (err) {
      setActionError(err.message || "Something went wrong. Please try again.");
    }
  };

  const handleDownload = async (itemId) => {
    const res = await authedFetch(`${API_URL}/portfolio/download/${itemId}`);
    if (!res.ok) return;
    const data = await res.json();
    window.open(data.download_url, "_blank");
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header />
        <div className="max-w-3xl mx-auto px-6 py-14 text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (notAuthorized || (!isOwner && !isStaff)) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header />
        <div className="max-w-3xl mx-auto px-6 py-14 text-center">
          <p className="text-gray-500 dark:text-gray-400">You don&apos;t have access to this portfolio.</p>
        </div>
      </div>
    );
  }

  const projects = portfolio?.items.filter((i) => i.type === "project") || [];
  const certificates = portfolio?.items.filter((i) => i.type === "certificate") || [];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      <section className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-gray-50 mb-2">
          {isOwner ? "My Portfolio" : `${decodedEmail}'s Portfolio`}
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">{decodedEmail}</p>

        {actionError && (
          <div className="mb-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
            {actionError}
          </div>
        )}

        {/* Resume */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-10">
          <h2 className="text-lg font-heading font-semibold text-gray-800 dark:text-gray-100 mb-4">Resume</h2>
          {isOwner ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Skills</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Electrical wiring, AutoCAD, Welding"
                  className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
                />
              </div>
              <button
                onClick={saveResume}
                disabled={savingResume}
                className="self-start text-xs bg-[#166534] text-white px-4 py-2 rounded-md disabled:opacity-50"
              >
                {savingResume ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-700 dark:text-gray-200">
              <p className="mb-3">{portfolio?.bio || "No bio yet."}</p>
              <p className="text-gray-500 dark:text-gray-400">{portfolio?.skills || "No skills listed yet."}</p>
            </div>
          )}
        </div>

        {/* Add item (owner only) */}
        {isOwner && (
          <form onSubmit={addItem} className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-10">
            <h2 className="text-lg font-heading font-semibold text-gray-800 dark:text-gray-100 mb-4">Add a Project or Certificate</h2>
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
              >
                <option value="project">Project</option>
                <option value="certificate">Certificate</option>
              </select>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title"
                required
                className="flex-1 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
              />
            </div>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
            />
            <div className="flex items-center gap-3">
              <input
                type="file"
                onChange={(e) => (window.__pendingPortfolioFile = e.target.files[0])}
                className="text-sm text-gray-600 dark:text-gray-300"
              />
              <button
                type="submit"
                disabled={!newTitle.trim() || adding}
                className="bg-[#166534] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#14532d] dark:hover:bg-green-700 transition disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        )}

        {/* Projects */}
        <div className="mb-10">
          <h2 className="text-lg font-heading font-semibold text-gray-800 dark:text-gray-100 mb-4">Projects</h2>
          {projects.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No projects yet.</p>
          ) : (
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
              {projects.map((item) => (
                <PortfolioItemRow
                  key={item.id}
                  item={item}
                  isOwner={isOwner}
                  editing={editingItemId === item.id}
                  itemEdit={itemEdit}
                  setItemEdit={setItemEdit}
                  itemFileReplacing={itemFileReplacing}
                  onEdit={() => startEditItem(item)}
                  onCancel={() => setEditingItemId(null)}
                  onSave={() => saveItem(item.id)}
                  onDelete={() => deleteItem(item.id)}
                  onReplaceFile={handleReplaceItemFile}
                  onDownload={() => handleDownload(item.id)}
                  videoUrl={videoUrls[item.id]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Certificates */}
        <div>
          <h2 className="text-lg font-heading font-semibold text-gray-800 dark:text-gray-100 mb-4">Certificates</h2>
          {certificates.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No certificates yet.</p>
          ) : (
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
              {certificates.map((item) => (
                <PortfolioItemRow
                  key={item.id}
                  item={item}
                  isOwner={isOwner}
                  editing={editingItemId === item.id}
                  itemEdit={itemEdit}
                  setItemEdit={setItemEdit}
                  itemFileReplacing={itemFileReplacing}
                  onEdit={() => startEditItem(item)}
                  onCancel={() => setEditingItemId(null)}
                  onSave={() => saveItem(item.id)}
                  onDelete={() => deleteItem(item.id)}
                  onReplaceFile={handleReplaceItemFile}
                  onDownload={() => handleDownload(item.id)}
                  videoUrl={videoUrls[item.id]}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function PortfolioItemRow({
  item,
  isOwner,
  editing,
  itemEdit,
  setItemEdit,
  itemFileReplacing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onReplaceFile,
  onDownload,
  videoUrl,
}) {
  if (editing) {
    return (
      <div className="p-4 flex flex-col gap-3">
        <input
          value={itemEdit.title}
          onChange={(e) => setItemEdit((p) => ({ ...p, title: e.target.value }))}
          placeholder="Title"
          className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
        />
        <textarea
          value={itemEdit.description}
          onChange={(e) => setItemEdit((p) => ({ ...p, description: e.target.value }))}
          rows={2}
          className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] dark:focus:ring-green-500"
        />
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-500 dark:text-gray-400">
            Replace file:
            <input type="file" onChange={onReplaceFile} disabled={itemFileReplacing} className="ml-2 text-xs" />
          </label>
          {itemFileReplacing && <span className="text-xs text-gray-400 dark:text-gray-500">Uploading...</span>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={!itemEdit.title.trim() || itemFileReplacing}
            className="text-xs bg-[#166534] text-white px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            Save
          </button>
          <button onClick={onCancel} className="text-xs text-gray-400 dark:text-gray-500">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const isVideo = isVideoFile(item.file_url);

  return (
    <div className="p-4 flex flex-col gap-3">
      {isVideo && (
        videoUrl ? (
          <video
            controls
            className="w-full max-h-80 rounded-md bg-black"
            src={videoUrl}
          />
        ) : (
          <div className="w-full h-40 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
            Loading video...
          </div>
        )
      )}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.title}</div>
          {item.description && (
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.description}</div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {item.file_url && !isVideo && (
            <button onClick={onDownload} className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#166534] dark:hover:text-green-400">
              Download
            </button>
          )}
          {isOwner && (
            <>
              <button onClick={onEdit} className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#166534] dark:hover:text-green-400">
                Edit
              </button>
              <button onClick={onDelete} className="text-xs text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400">
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
