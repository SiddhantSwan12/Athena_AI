import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const ThemeCtx = createContext({ theme: "dark", toggle: () => {} });
const THEME_TRANSITION_MS = 420;

export function ThemeProvider({ children }) {
  const transitionTimer = useRef(null);
  const [theme, setTheme] = useState(() => {
    try {
      const s = localStorage.getItem("athena_theme");
      if (s === "light" || s === "dark") return s;
    } catch {}
    return "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    try { localStorage.setItem("athena_theme", theme); } catch {}
  }, [theme]);

  useEffect(
    () => () => {
      if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    },
    []
  );

  const toggle = useCallback(() => {
    const root = document.documentElement;
    root.classList.add("theme-transitioning");

    if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    setTheme((t) => (t === "dark" ? "light" : "dark"));

    transitionTimer.current = window.setTimeout(() => {
      root.classList.remove("theme-transitioning");
      transitionTimer.current = null;
    }, THEME_TRANSITION_MS);
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
