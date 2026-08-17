"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://butula-elibrary-production.up.railway.app";

export async function authedFetch(url, options = {}) {
  const token = await auth.currentUser?.getIdToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const res = await authedFetch(`${API_URL}/users/${currentUser.email}`);
          const data = await res.json();
          setRole(data.role);
        } catch {
          setRole(null);
        } finally {
          setLoading(false);
        }
      } else {
        setRole(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return { user, role, loading };
}

export { API_URL };
