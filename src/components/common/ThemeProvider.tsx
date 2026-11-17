import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeContext, type Theme } from "./theme-context";

const STORAGE_KEY = "theme";

function readStored(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // localStorage bisa diblokir; pakai default
  }
  return "system";
}

function apply(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStored);

  useEffect(() => {
    apply(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (t: Theme) => {
        try {
          localStorage.setItem(STORAGE_KEY, t);
        } catch {
          // abaikan
        }
        setThemeState(t);
      },
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
