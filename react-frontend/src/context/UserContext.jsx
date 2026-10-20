import { createContext, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch(`${API_URL}/user`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (active) setUser(data.user);
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  async function login(username, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    setUser(data.user);
  }

  async function logout() {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    setUser(null);
  }

  return (
    <UserContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}