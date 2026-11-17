import { createContext, useContext } from "react";

export type Theme = "light" | "dark" | "system";

export interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeState | null>(null);

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme harus dipakai di dalam ThemeProvider");
  return ctx;
}
