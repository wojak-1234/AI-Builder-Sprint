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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [isManual, setIsManual] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("eeum_theme") as Theme | null;
    const manualFlag = localStorage.getItem("eeum_theme_manual") === "true";
    
    let initialTheme: Theme = "light";
    if (manualFlag && savedTheme) {
      initialTheme = savedTheme;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsManual(true);
    } else {
      initialTheme = evaluateAutomaticTheme();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsManual(false);
    }
    
    setTheme(initialTheme);
    setMounted(true);
    
    // Apply class immediately on mount
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Set up periodic time check to automatically update theme (every minute)
  useEffect(() => {
    if (isManual) return; // Skip if user set theme manually

    const interval = setInterval(() => {
      const targetTheme = evaluateAutomaticTheme();
      if (theme !== targetTheme) {
        setTheme(targetTheme);
        if (targetTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [theme, isManual]);

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
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    setIsManual(true);
    
    localStorage.setItem("eeum_theme", nextTheme);
    localStorage.setItem("eeum_theme_manual", "true");
    
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isManual, toggleTheme }}>
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
