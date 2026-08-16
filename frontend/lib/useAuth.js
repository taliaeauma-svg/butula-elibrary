"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://butula-elibrary-production.up.railway.app";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetch(`${API_URL}/users/${currentUser.email}`)
          .then((res) => res.json())
          .then((data) => setRole(data.role))
          .catch(() => setRole(null))
          .finally(() => setLoading(false));
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
