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
