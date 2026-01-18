"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

const DEV_BYPASS_AUTH = false; // DISABLED - using real GitHub OAuth

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGitHub: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    console.log("[AuthContext] refreshUser called");
    try {
      const token = localStorage.getItem("access_token");
      console.log("[AuthContext] Token from localStorage:", token ? `${token.slice(0, 20)}...` : "none");
      
      if (!token) {
        console.log("[AuthContext] No token, setting user to null");
        setUser(null);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      console.log("[AuthContext] Fetching /api/auth/me from:", apiUrl);
      
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("[AuthContext] /api/auth/me response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[AuthContext] User data received:", data);
        setUser({
          id: data.id,
          email: data.email || "",
          name: data.name || data.username || "",
          username: data.username,
          avatarUrl: data.avatar_url,
        });
      } else {
        console.log("[AuthContext] Auth failed, clearing token");
        localStorage.removeItem("access_token");
        setUser(null);
      }
    } catch (error) {
      console.error("[AuthContext] Failed to refresh user:", error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      console.log("[AuthContext] Initializing auth...");
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
      console.log("[AuthContext] Auth initialization complete");
    };

    initAuth();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();
    localStorage.setItem("access_token", data.access_token);
    await refreshUser();
  };

  const loginWithGitHub = () => {
    console.log("[AuthContext] Initiating GitHub OAuth...");
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/github`;
  };

  const logout = () => {
    console.log("[AuthContext] Logging out...");
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGitHub,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
