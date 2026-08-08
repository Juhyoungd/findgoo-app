import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { palettes, themeOptions } from "@/src/theme/palettes";
import type { ThemeId } from "@/src/types/findgoo";

type ThemeContextValue = {
  activeTheme: (typeof themeOptions)[number];
  nextTheme: (typeof themeOptions)[number];
  palette: (typeof palettes)[ThemeId];
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// [색상 변경] 웹의 useThemePicker와 동일하게 다섯 테마를 순서대로 순환합니다.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>("dusk");

  const activeIndex = themeOptions.findIndex((theme) => theme.id === themeId);
  const activeTheme = themeOptions[activeIndex];
  const nextTheme = themeOptions[(activeIndex + 1) % themeOptions.length];

  const cycleTheme = useCallback(() => {
    setThemeId((current) => {
      const index = themeOptions.findIndex((theme) => theme.id === current);
      return themeOptions[(index + 1) % themeOptions.length].id;
    });
  }, []);

  const value = useMemo(
    () => ({ activeTheme, nextTheme, palette: palettes[themeId], cycleTheme }),
    [activeTheme, nextTheme, themeId, cycleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme은 ThemeProvider 안에서만 사용할 수 있어요.");
  return context;
}
