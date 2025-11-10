"use client";

import { useTheme } from "@/app/features/theme/ThemeProvider";
import styles from "./ThemeToggle.module.css";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const buttonClasses = [styles.themeToggle, isLight ? styles.themeToggleActive : "", className]
    .filter(Boolean)
    .join(" ");
  const thumbClasses = [styles.thumb, isLight ? styles.thumbActive : ""].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      aria-pressed={isLight}
      title={isLight ? "Light mode on" : "Dark mode on"}
    >
      <span className={thumbClasses}>
        <i className={`fa-solid ${isLight ? "fa-sun" : "fa-moon"}`} aria-hidden="true" />
      </span>
    </button>
  );
}
