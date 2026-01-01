"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiGet } from "@/app/lib/api";

type ThemeCtx = {
  lightMode: boolean;
  setLightMode: (v: boolean) => void;
  refreshThemeFromProfile: () => Promise<void>;
};

const Ctx = createContext<ThemeCtx | null>(null);

function applyRootClasses(lightMode: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", !lightMode);
}

export function ThemeProvider({
  initialLightMode = true,
  children,
}: {
  initialLightMode?: boolean;
  children: React.ReactNode;
}) {
  const [lightMode, setLightMode] = useState<boolean>(initialLightMode);

  async function refreshThemeFromProfile() {
    try {
      const me = await apiGet("/api/members/me");
      // backend skickar lightMode: true/false
      const lm = !!me?.lightMode;
      setLightMode(lm);
      applyRootClasses(lm);
    } catch {
      // ej inloggad: välj default (eller prefers-color-scheme)
      setLightMode(true);
      applyRootClasses(true);
    }
  }

  // 1) Apply class när state ändras
  useEffect(() => {
    applyRootClasses(lightMode);
  }, [lightMode]);

  // 2) Läs från profil när appen startar
  useEffect(() => {
    refreshThemeFromProfile();
  }, []);

  // 3) Lyssna när login/logout händer
  useEffect(() => {
    const onAuthChanged = () => refreshThemeFromProfile();
    window.addEventListener("auth-changed", onAuthChanged);
    return () => window.removeEventListener("auth-changed", onAuthChanged);
  }, []);

  return (
    <Ctx.Provider value={{ lightMode, setLightMode, refreshThemeFromProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used inside ThemeProvider");
  return v;
}
