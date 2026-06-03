import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

type ThemePreference = "light" | "dark" | "system";

type ThemeContextValue = {
  themePreference: ThemePreference;
  resolvedTheme: "light" | "dark";
  setThemePreference: (value: ThemePreference) => void;
  toggleTheme: () => void;
};

const storageKey = "performai-theme";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveTheme(themePreference: ThemePreference) {
  if (themePreference === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return themePreference;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey) as ThemePreference | null;
    const nextPreference = stored && ["light", "dark", "system"].includes(stored) ? stored : "light";
    setThemePreferenceState(nextPreference);
    setResolvedTheme(resolveTheme(nextPreference));
  }, []);

  useEffect(() => {
    const nextResolvedTheme = resolveTheme(themePreference);
    setResolvedTheme(nextResolvedTheme);
    document.body.classList.toggle("theme-dark", nextResolvedTheme === "dark");
    window.localStorage.setItem(storageKey, themePreference);

    if (themePreference !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      setResolvedTheme(media.matches ? "dark" : "light");
      document.body.classList.toggle("theme-dark", media.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [themePreference]);

  function setThemePreference(value: ThemePreference) {
    setThemePreferenceState(value);
  }

  function toggleTheme() {
    setThemePreferenceState((current) => (resolveTheme(current) === "dark" ? "light" : "dark"));
  }

  const value = useMemo(
    () => ({
      themePreference,
      resolvedTheme,
      setThemePreference,
      toggleTheme
    }),
    [resolvedTheme, themePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
