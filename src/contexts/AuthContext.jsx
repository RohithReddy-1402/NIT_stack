import {
    getToken,
    removeToken,
    setToken as saveToken,
} from "@/services/storage";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const restoreSession = async () => {
    console.log("Checking authentication...");

    try {
      const storedToken = await getToken();

      console.log("Stored token:", storedToken ? "Token found" : "No token");

      if (!storedToken) {
        setAuthToken(null);
        setUser(null);
        return;
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL;

      console.log("Calling:", `${API_URL}/auth/check`);

      const response = await fetch(`${API_URL}/auth/check`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Auth check status:", response.status);

      if (!response.ok) {
        console.log("Stored token is invalid");

        await removeToken();

        setAuthToken(null);
        setUser(null);

        return;
      }

      const userData = await response.json();

      console.log("User authenticated:", userData);

      setAuthToken(storedToken);
      setUser(userData);
    } catch (error) {
      console.error("Session restore failed:", error);

      try {
        await removeToken();
      } catch (removeError) {
        console.error("Failed to remove token:", removeError);
      }

      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  async function googleLogin(userData) {
    console.log(userData);
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/login/google`,
      {
        method: "POST",

        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          EmailID: userData.email,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Google login failed");
    }
    setUser(data.user);

    return data;
  }

  async function login(email, password) {
    const API_URL = process.env.EXPO_PUBLIC_API_URL;

    const response = await fetch(`${API_URL}/login`, {
      method: "POST",

      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    await saveToken(data.token);

    setAuthToken(data.token);
    setUser(data.user);

    return data;
  }

  async function logout() {
    try {
      await removeToken();
    } finally {
      setAuthToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        googleLogin,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
