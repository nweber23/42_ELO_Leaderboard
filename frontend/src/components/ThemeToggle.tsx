import { useState, useEffect } from "react";
import { getStoredTheme, setTheme, type Theme } from "../state/theme";
import "./theme-toggle.css";

export function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(getStoredTheme);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (currentTheme === "system") {
        // Force re-render to update the icon
        setCurrentTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [currentTheme]);

  const getEffectiveTheme = (): "light" | "dark" => {
    if (currentTheme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return currentTheme;
  };

  const cycleTheme = () => {
    const nextTheme: Theme =
      currentTheme === "light"
        ? "dark"
        : currentTheme === "dark"
        ? "system"
        : "light";

    setTheme(nextTheme);
    setCurrentTheme(nextTheme);
  };

  const effectiveTheme = getEffectiveTheme();

  return (
    <button
      className="theme-toggle"
      onClick={cycleTheme}
      aria-label={`Current theme: ${currentTheme}. Click to change.`}
      title={`Theme: ${currentTheme}`}
    >
      <span className="theme-toggle__icon">
        {effectiveTheme === "dark" ? (
          // Moon icon for dark mode
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          // Sun icon for light mode
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </span>
      {currentTheme === "system" && (
        <span className="theme-toggle__indicator" title="Using system preference">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        </span>
      )}
    </button>
  );
}
