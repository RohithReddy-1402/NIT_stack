import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { fetchMyForumProfile } from "@/services/forum";
import { router } from "expo-router";
import { useCallback, useEffect, useSyncExternalStore } from "react";

// The signed-in user's forum profile, fetched once per token and shared by
// every forum screen. status: "anon" (logged out) | "loading" | "none"
// (logged in, no handle yet) | "ready".

let snapshot = { token: null, status: "anon", profile: null };
const listeners = new Set();
let inflight = null;

const set = (next) => {
  snapshot = next;
  listeners.forEach((fn) => fn());
};

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function setForumProfile(profile) {
  set({ ...snapshot, status: profile ? "ready" : "none", profile });
}

async function load(token) {
  if (inflight?.token === token) return inflight.promise;
  set({ token, status: "loading", profile: null });
  const promise = fetchMyForumProfile(token)
    .then(({ profile }) => {
      if (snapshot.token === token) set({ token, status: profile ? "ready" : "none", profile });
    })
    .catch(() => {
      // Network trouble: treat as unknown-but-logged-in; writes will retry via
      // the FORUM_PROFILE_REQUIRED path if the profile really is missing.
      if (snapshot.token === token) set({ token, status: "none", profile: null });
    })
    .finally(() => {
      if (inflight?.token === token) inflight = null;
    });
  inflight = { token, promise };
  return promise;
}

export function useForumProfile() {
  const { token, loading: authLoading } = useAuth();
  const current = useSyncExternalStore(subscribe, () => snapshot);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      if (snapshot.status !== "anon") set({ token: null, status: "anon", profile: null });
    } else if (snapshot.token !== token) {
      load(token);
    }
  }, [token, authLoading]);

  const status = authLoading || (token && current.token !== token) ? "loading" : current.status;
  return { status, profile: current.profile, refresh: () => token && load(token) };
}

/**
 * `ensureMember()` before any write: sends logged-out users to login and
 * users without a handle to onboarding, returning false in both cases.
 * `handleError(err, fallback)` does the same routing for API errors, else toasts.
 */
export function useForumGate() {
  const { isLoggedIn } = useAuth();
  const { status } = useForumProfile();
  const { addToast } = useToast();

  const ensureMember = useCallback(() => {
    if (!isLoggedIn) {
      addToast("Log in to join the discussion", "info");
      router.push("/login");
      return false;
    }
    if (status === "none") {
      router.push("/forum/onboarding");
      return false;
    }
    if (status !== "ready") {
      addToast("One moment — loading your forum profile", "info");
      return false;
    }
    return true;
  }, [isLoggedIn, status, addToast]);

  const handleError = useCallback(
    (error, fallback = "Something went wrong") => {
      if (error?.code === "FORUM_PROFILE_REQUIRED") {
        router.push("/forum/onboarding");
      } else if (error?.status === 401) {
        addToast("Please log in again", "error");
        router.push("/login");
      } else {
        addToast(error?.message || fallback, "error");
      }
    },
    [addToast],
  );

  return { ensureMember, handleError };
}
