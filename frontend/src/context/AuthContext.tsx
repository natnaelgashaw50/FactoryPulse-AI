import React, { createContext, useContext, useState, useCallback } from "react";
import client from "../api/client";

type UserT = { id: number; name: string; email: string; role: string } | null;

type AuthCtx = {
  user: UserT;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("ishfp_token"));
  const [user, setUser] = useState<UserT>(
    JSON.parse(localStorage.getItem("ishfp_user") || "null")
  );

  const login = useCallback(async (email: string, password: string) => {
    const res = await client.post("/auth/login", { email, password });
    localStorage.setItem("ishfp_token", res.data.access_token);

localStorage.setItem(
  "ishfp_refresh",
  res.data.refresh_token
);

localStorage.setItem(
  "ishfp_user",
  JSON.stringify(res.data.user)
);
    setToken(res.data.access_token);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(() => {
   localStorage.removeItem("ishfp_token");

localStorage.removeItem("ishfp_refresh");

localStorage.removeItem("ishfp_user");
    setToken(null);
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, token, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
