import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { palettes, themeOptions } from "@/src/theme/palettes";
import type { ThemeId } from "@/src/types/findgoo";

type ThemeContextValue = {
  activeTheme: (typeof themeOptions)[number];
  palette: (typeof palettes)[ThemeId];
  setTheme: (themeId: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// [색상 변경] 웹의 useThemePicker와 동일하게 다섯 테마를 순서대로 순환합니다.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>("warm");

  const activeIndex = themeOptions.findIndex((theme) => theme.id === themeId);
  const activeTheme = themeOptions[activeIndex];

  const value = useMemo(
    () => ({ activeTheme, palette: palettes[themeId], setTheme: setThemeId }),
    [activeTheme, themeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme은 ThemeProvider 안에서만 사용할 수 있어요.");
  return context;
}
