import { useEffect } from "react";
import { useStore } from "@/store";
import { LocalStorageKey, Theme } from "@/types";
import { themeConfig } from "@/configs";

export function useTheme() {
  const { theme, setTheme } = useStore();

  useEffect(() => {
    const localTheme = localStorage.getItem(LocalStorageKey.Theme);
    if (localTheme && Object.keys(themeConfig).includes(localTheme)) {
      setTheme(localTheme as Theme);
    }
  }, [setTheme]);

  function toggleTheme() {
    const { toggle } = themeConfig[theme];
    localStorage.setItem(LocalStorageKey.Theme, toggle);
    setTheme(toggle);
  }

  return { theme, toggleTheme };
}
