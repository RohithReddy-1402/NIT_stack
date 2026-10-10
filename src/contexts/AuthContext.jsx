import {
    getToken,
    removeToken,
    setToken as saveToken,
} from "@/services/storage";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

// Backend responses aren't always shaped identically (some endpoints wrap
// the user under a `user` key, name may come back as `fullName`/`username`),
// so normalize whatever we get into one shape the UI can rely on.
function normalizeUser(raw) {
  if (!raw) return raw;
  const source = raw.user ?? raw;

  const name =
    source.name ||
    source.fullName ||
    source.full_name ||
    source.username ||
    (source.email ? source.email.split("@")[0] : null);

  return { ...source, name: name || source.name };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const restoreSession = async () => {
    try {
      const storedToken = await getToken();

      if (!storedToken) {
        setAuthToken(null);
        setUser(null);
        return;
      }

      const API_URL = process.env.EXPO_PUBLIC_API_URL;

      const response = await fetch(`${API_URL}/auth/check`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Covers both an invalid token and a not-yet-verified account
        // (/auth/check returns 403 EMAIL_NOT_VERIFIED for the latter) —
        // either way there's no valid session to restore.
        await removeToken();

        setAuthToken(null);
        setUser(null);

        return;
      }

      const userData = await response.json();

      setAuthToken(storedToken);
      setUser(normalizeUser(userData));
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

  // `credential` is a Google Identity Services credential or a Firebase ID
  // token; the backend verifies it and takes the email from it.
  async function googleLogin(credential) {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/login/google`,
      {
        method: "POST",

        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ credential }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Google login failed");
    }

    return data;
  }

  async function appleLogin({ identityToken, appleUserId, email, name }) {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/login/apple`,
      {
        method: "POST",

        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          identityToken,
          appleUserId,
          EmailID: email,
          name,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Apple login failed");
    }

    return data;
  }

  // Stores a session already established elsewhere (email/password fetch,
  // Google, Apple) without triggering another network call.
  function setSession(sessionUser, sessionToken) {
    setAuthToken(sessionToken);
    setUser(normalizeUser(sessionUser));
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
    setUser(normalizeUser(data.user));

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
        appleLogin,
        setSession,
        refreshSession: restoreSession,
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
