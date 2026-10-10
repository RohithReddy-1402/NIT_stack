import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { router } from "expo-router";
import { useCallback } from "react";

/**
 * Auth gate for opportunity write-actions (bookmark, report, remind-me,
 * track application). Simpler than forum's useForumGate — opportunities
 * don't need a separate profile-claim step, just being logged in.
 */
export function useOpportunityGate() {
  const { isLoggedIn } = useAuth();
  const { addToast } = useToast();

  const ensureAuth = useCallback(() => {
    if (!isLoggedIn) {
      addToast("Log in to do that", "info");
      router.push("/login");
      return false;
    }
    return true;
  }, [isLoggedIn, addToast]);

  const handleError = useCallback(
    (error, fallback = "Something went wrong") => {
      if (error?.status === 401) {
        addToast("Please log in again", "error");
        router.push("/login");
      } else {
        addToast(error?.message || fallback, "error");
      }
    },
    [addToast],
  );

  return { ensureAuth, handleError };
}
