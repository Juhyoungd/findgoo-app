import type { ThemeId } from "@/src/types/findgoo";

// [앱 색상]
// 색상 이름, 아이콘, 마이페이지 미리보기 색을 한 곳에서 관리합니다.
export const themeOptions: ReadonlyArray<{
  id: ThemeId;
  label: string;
  icon: string;
  colors: readonly [string, string, string];
}> = [
  { id: "warm", label: "살구 크림", icon: "●", colors: ["#ef8f73", "#f8d7c9", "#c9d9cd"] },
  { id: "dusk", label: "라일락 밀크", icon: "●", colors: ["#8170a8", "#ddd3ee", "#c8d9e8"] },
  { id: "forest", label: "세이지 가든", icon: "●", colors: ["#69856f", "#d2dfc8", "#f0d9b9"] },
  { id: "ocean", label: "블루 소다", icon: "●", colors: ["#4d8197", "#c8e8e2", "#f7deb8"] },
  { id: "berry", label: "로즈 티", icon: "●", colors: ["#a85f78", "#f0cbd5", "#dcd2ef"] },
];

export type ThemePalette = {
  ink: string;
  muted: string;
  paper: string;
  white: string;
  line: string;
  lime: string;
  limeDark: string;
  orange: string;
  blue: string;
};

// [앱 색상] 웹의 CSS 변수(:root, .theme-*)를 RN 스타일에서 쓸 수 있게 값으로 옮겨왔습니다.
export const palettes: Record<ThemeId, ThemePalette> = {
  warm: { ink: "#342d2a", muted: "#7f746e", paper: "#fbf5ef", white: "#fffdfa", line: "#eadfd5", lime: "#ef8f73", limeDark: "#cf7259", orange: "#e87863", blue: "#f8d7c9" },
  dusk: { ink: "#322d3e", muted: "#777182", paper: "#f7f3fa", white: "#fffefe", line: "#e8e0ee", lime: "#8170a8", limeDark: "#67578b", orange: "#d68193", blue: "#ddd3ee" },
  forest: { ink: "#293329", muted: "#737c70", paper: "#f4f7f0", white: "#fffefa", line: "#dfe7d8", lime: "#69856f", limeDark: "#526b58", orange: "#c98a55", blue: "#d2dfc8" },
  ocean: { ink: "#22333a", muted: "#6f8085", paper: "#f0f7f7", white: "#ffffff", line: "#d9e8e6", lime: "#4d8197", limeDark: "#396a80", orange: "#e1a35d", blue: "#c8e8e2" },
  berry: { ink: "#3a2931", muted: "#86737d", paper: "#faf2f5", white: "#fffefe", line: "#eedde4", lime: "#a85f78", limeDark: "#884a61", orange: "#dc7d9a", blue: "#f0cbd5" },
};
