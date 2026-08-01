"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={theme === "light" ? "야간 모드로 전환" : "주간 모드로 전환"}
      className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center hover:opacity-90 text-primary transition-all duration-200 cursor-pointer"
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
