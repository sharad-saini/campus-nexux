"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface AuthUser {
  id: string;
  tenant_id: string;
  college_name: string;
  college_code: string;
  tier: string;
  tier_name: string;
  features: Record<string, boolean>;
  email: string;
  full_name: string;
  name?: string;
  role: string;
  normalized_role?: "student" | "faculty" | "admin" | "other";
  department: string;
  cgpa?: number;
  karma_points?: number;
  opt_in_recruiter?: boolean;
  is_new_account?: boolean;
}

export class GoogleAccountNotFoundError extends Error {
  constructor(
    readonly email: string,
    readonly fullName: string
  ) {
    super("This Google account has not been registered yet.");
    this.name = "GoogleAccountNotFoundError";
  }
}

export function normalizeRole(role?: string): "student" | "faculty" | "admin" | "other" {
  const r = (role || "").trim().toLowerCase();
  if (["admin", "dean", "chancellor_dean"].includes(r)) return "admin";
  if (["faculty", "professor", "hod", "professor_hod"].includes(r)) return "faculty";
  if (r === "student") return "student";
  return "other";
}

export function getDashboardPathForRole(role?: string): string {
  const norm = normalizeRole(role);
  switch (norm) {
    case "student":
      return "/student/dashboard";
    case "faculty":
      return "/faculty/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "other":
    default:
      return "/other/dashboard";
  }
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    credsOrEmail: { email: string; password: string; college_code?: string } | string,
    password?: string,
    college_code?: string
  ) => Promise<AuthUser>;
  loginWithGoogle: (
    credential: string,
    registration?: { role: "student" | "faculty" | "other"; department?: string }
  ) => Promise<AuthUser>;
  register: (data: {
    email: string;
    password: string;
    name?: string;
    full_name?: string;
    role: string;
    department?: string;
    college_code?: string;
  }) => Promise<AuthUser>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ message: string; demo_token?: string; reset_token?: string }>;
  resetPassword: (payload: { email: string; token: string; new_password: string }) => Promise<{ message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  // Hydrate session on initial load
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("nexus_token");
      const savedUserStr = localStorage.getItem("nexus_user");

      if (savedToken && savedUserStr) {
        const parsed = JSON.parse(savedUserStr) as AuthUser;
        parsed.normalized_role = normalizeRole(parsed.role);
        setToken(savedToken);
        setUser(parsed);
        setCookie("nexus_token", savedToken, 7);
        setCookie("nexus_role", parsed.normalized_role, 7);
      }
    } catch (e) {
      console.error("Session hydration error:", e);
      localStorage.removeItem("nexus_token");
      localStorage.removeItem("nexus_user");
      deleteCookie("nexus_token");
      deleteCookie("nexus_role");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (
      credsOrEmail: { email: string; password: string; college_code?: string } | string,
      rawPassword?: string,
      rawCollegeCode?: string
    ) => {
      setIsLoading(true);
      try {
        const payload =
          typeof credsOrEmail === "object"
            ? credsOrEmail
            : {
                email: credsOrEmail,
                password: rawPassword || "",
                college_code: rawCollegeCode || "NITX",
              };

        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.detail || "Invalid email or password");
        }

        const data = await res.json();
        const userData: AuthUser = {
          ...data.user,
          normalized_role: normalizeRole(data.user.role),
          is_new_account: Boolean(data.user.is_new_account || data.account_created),
        };

        setToken(data.access_token);
        setUser(userData);

        localStorage.setItem("nexus_token", data.access_token);
        localStorage.setItem("nexus_user", JSON.stringify(userData));
        setCookie("nexus_token", data.access_token, 7);
        setCookie("nexus_role", userData.normalized_role || "other", 7);

        return userData;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loginWithGoogle = useCallback(async (
    credential: string,
    registration?: { role: "student" | "faculty" | "other"; department?: string }
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, ...registration }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (
          res.status === 404 &&
          errorData.code === "GOOGLE_ACCOUNT_NOT_FOUND" &&
          typeof errorData.identity?.email === "string"
        ) {
          throw new GoogleAccountNotFoundError(
            errorData.identity.email,
            typeof errorData.identity.name === "string" ? errorData.identity.name : ""
          );
        }
        throw new Error(errorData.detail || "Google sign-in failed");
      }

      const data = await res.json();
      const userData: AuthUser = {
        ...data.user,
        normalized_role: normalizeRole(data.user.role),
        is_new_account: Boolean(data.user.is_new_account || data.account_created),
      };

      setToken(data.access_token);
      setUser(userData);
      localStorage.setItem("nexus_token", data.access_token);
      localStorage.setItem("nexus_user", JSON.stringify(userData));
      setCookie("nexus_token", data.access_token, 7);
      setCookie("nexus_role", userData.normalized_role || "other", 7);
      return userData;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      name?: string;
      full_name?: string;
      role: string;
      department?: string;
      college_code?: string;
    }) => {
      setIsLoading(true);
      try {
        const displayName = data.full_name || data.name || "Campus User";
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            full_name: displayName,
            name: displayName,
            role: data.role,
            department: data.department || "CSE",
            college_code: data.college_code || "NITX",
          }),
        });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Registration failed");
      }

      const resData = await res.json();
      const userData: AuthUser = {
        ...resData.user,
        normalized_role: normalizeRole(resData.user.role),
        is_new_account: Boolean(resData.user.is_new_account || resData.account_created),
      };

      setToken(resData.access_token);
      setUser(userData);

      localStorage.setItem("nexus_token", resData.access_token);
      localStorage.setItem("nexus_user", JSON.stringify(userData));
      setCookie("nexus_token", resData.access_token, 7);
      setCookie("nexus_role", userData.normalized_role || "other", 7);

      return userData;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("nexus_token");
    localStorage.removeItem("nexus_user");
    deleteCookie("nexus_token");
    deleteCookie("nexus_role");
    setToken(null);
    setUser(null);

    // Call backend logout asynchronously
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});

    router.push("/login");
  }, [router]);

  const forgotPassword = useCallback(async (email: string) => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to process forgot password request");
    }

    return await res.json();
  }, []);

  const resetPassword = useCallback(async (payload: { email: string; token: string; new_password: string }) => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to reset password");
    }

    return await res.json();
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    loginWithGoogle,
    register,
    logout,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
