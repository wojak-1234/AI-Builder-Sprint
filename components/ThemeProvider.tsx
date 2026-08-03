"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  isManual: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const evaluateAutomaticTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const hour = new Date().getHours();
  // Dark mode between 6 PM (18:00) and 6 AM (06:00)
  return hour >= 18 || hour < 6 ? "dark" : "light";
};

// Keeps the mobile browser chrome / PWA status bar color in sync with the active theme,
// since a static <meta theme-color> can't react to our manual/time-based .dark class toggle.
const syncMetaThemeColor = (theme: Theme) => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#1D1C1A" : "#FAF8F5");
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount - ALWAYS dark mode
  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.add("dark");
    syncMetaThemeColor("dark");
  }, []);

  // Apply active user's accessibility settings dynamically
  useEffect(() => {
    if (!mounted) return;

    const applyAccessibility = () => {
      const userStr = localStorage.getItem("eeum_mock_curr_user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          
          // Apply text size
          const size = userObj.textSize || "medium";
          document.documentElement.classList.remove("text-size-small", "text-size-medium", "text-size-large", "text-size-xl");
          document.documentElement.classList.add(`text-size-${size}`);

          // Apply color vision
          const vision = userObj.colorVision || "default";
          document.documentElement.classList.remove("color-vision-daltonism", "color-vision-tritanopia", "color-vision-contrast");
          if (vision !== "default") {
            document.documentElement.classList.add(`color-vision-${vision}`);
          }
        } catch (e) {
          console.error("Accessibility apply error:", e);
        }
      } else {
        // Set standard defaults
        document.documentElement.classList.remove("text-size-small", "text-size-large", "text-size-xl");
        document.documentElement.classList.add("text-size-medium");
        document.documentElement.classList.remove("color-vision-daltonism", "color-vision-tritanopia", "color-vision-contrast");
      }
    };

    applyAccessibility();

    // Listen to changes in localStorage (for role selection or signup completion)
    const handleStorageChange = () => {
      applyAccessibility();
    };

    window.addEventListener("storage", handleStorageChange);
    // Custom event to trigger immediate reload within the same tab
    window.addEventListener("eeum_user_changed", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("eeum_user_changed", handleStorageChange);
    };
  }, [mounted]);

  const toggleTheme = () => {
    // Theme is strictly locked to dark mode
    document.documentElement.classList.add("dark");
    syncMetaThemeColor("dark");
  };

  return (
    <ThemeContext.Provider value={{ theme: "dark", isManual: true, toggleTheme }}>
      <div className={mounted ? "" : "opacity-0"}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
