import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { palettes, themeOptions } from "@/src/theme/palettes";
import type { ThemeId } from "@/src/types/findgoo";

type ThemeContextValue = {
  activeTheme: (typeof themeOptions)[number];
  palette: (typeof palettes)[ThemeId];
  setTheme: (themeId: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE_KEY = "findgoo.theme";

// [색상 변경] 선택한 테마는 앱을 다시 열어도 유지하고 모든 화면이 같은 팔레트를 참조합니다.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>("apricot");

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (themeOptions.some((theme) => theme.id === stored)) setThemeId(stored as ThemeId);
    }).catch(() => undefined);
  }, []);

  const activeTheme = themeOptions.find((theme) => theme.id === themeId) ?? themeOptions[0];

  function setTheme(nextThemeId: ThemeId) {
    setThemeId(nextThemeId);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, nextThemeId).catch(() => undefined);
  }

  const value = useMemo(
    () => ({ activeTheme, palette: palettes[themeId], setTheme }),
    [activeTheme, themeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme은 ThemeProvider 안에서만 사용할 수 있어요.");
  return context;
}
