"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

const DEV_BYPASS_AUTH = false; // Enabled for development

interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_USER: User = {
  id: "dev-user-123",
  email: "dev@architex.app",
  name: "Dev User",
  avatarUrl: "https://i.pravatar.cc/150?u=dev",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    if (DEV_BYPASS_AUTH) {
      setUser(DEV_USER);
      return;
    }
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUser(data.user || data);
      } else {
        localStorage.removeItem("access_token");
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      if (DEV_BYPASS_AUTH) {
        setUser(DEV_USER);
        setIsLoading(false);
        return;
      }
      await refreshUser();
      setIsLoading(false);
    };

    initAuth();
  }, []);

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

  const loginWithGitHub = async () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/github`;
  };

  const logout = async () => {
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
