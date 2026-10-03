"use client";

import { createContext, useContext, useEffect, useState } from "react";

type NavigationBlockerContextType = {
  isBlocked: boolean;
  setIsBlocked: (isBlocked: boolean) => void;
};

const NavigationBlockerContext = createContext<NavigationBlockerContextType>({
  isBlocked: false,
  setIsBlocked: () => {},
});

export function NavigationBlockerProvider({ children }: { children: React.ReactNode }) {
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (!isBlocked) return;
    // Leaving the app entirely (tab close, refresh, typed URL) — in-app
    // link clicks are guarded separately via <Link onNavigate>.
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isBlocked]);

  return (
    <NavigationBlockerContext.Provider value={{ isBlocked, setIsBlocked }}>
      {children}
    </NavigationBlockerContext.Provider>
  );
}

export function useNavigationBlocker() {
  return useContext(NavigationBlockerContext);
}

// What a form with changes that mustn't get lost needs. Returns markDirty,
// for its onChange. The block is lifted by a successful save (`state` is the
// form's action state, a new object every time it resolves, so every save
// counts and not just the first) and by the form going away. Without the
// second, leaving a dirty form through "Leave without saving?" left the flag
// set for the pages after it, and every link there asked the same question.
export function useUnsavedChanges(state: { success?: boolean } | undefined) {
  const { setIsBlocked } = useNavigationBlocker();

  useEffect(() => {
    if (state?.success) queueMicrotask(() => setIsBlocked(false));
  }, [state, setIsBlocked]);

  useEffect(() => () => setIsBlocked(false), [setIsBlocked]);

  return () => setIsBlocked(true);
}
