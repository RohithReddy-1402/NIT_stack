import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";

// A screen underneath a pushed screen stays mounted, so its data goes stale
// while you're away (add a subject, press back, and the list is unchanged).
// This refetches every time the screen regains focus. The very first focus is
// skipped because the screen's own hooks already load their data on mount.
export function useRefetchOnFocus(refetch) {
  const latestRefetch = useRef(refetch);
  const isFirstFocus = useRef(true);

  useEffect(() => {
    latestRefetch.current = refetch;
  });

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      latestRefetch.current();
    }, []),
  );
}
