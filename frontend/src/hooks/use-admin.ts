"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMe,
  loginAdmin,
  logoutAdmin,
  type AdminUser,
} from "@/lib/api-client";

export function useAdmin() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await getMe();
      if (cancelled) return;
      setAdmin(me);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const a = await loginAdmin(email, password);
    setAdmin(a);
    return a;
  }, []);

  const logout = useCallback(async () => {
    await logoutAdmin();
    setAdmin(null);
  }, []);

  return { admin, loading, login, logout };
}
