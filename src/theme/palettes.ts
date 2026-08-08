import type { ThemeId } from "@/src/types/findgoo";

// [앱 색상]
// 색상 이름, 아이콘, 마이페이지 미리보기 색을 한 곳에서 관리합니다.
export const themeOptions: ReadonlyArray<{
  id: ThemeId;
  label: string;
  icon: string;
  colors: readonly [string, string, string];
}> = [
  { id: "dusk", label: "라벤더", icon: "◐", colors: ["#746391", "#caddea", "#f4e8bd"] },
  { id: "warm", label: "살구", icon: "●", colors: ["#e9866c", "#c9d9cd", "#d5caea"] },
  { id: "ocean", label: "블루민트", icon: "≈", colors: ["#4f7890", "#b7d9d4", "#f5e7c8"] },
  { id: "forest", label: "포레스트", icon: "♣", colors: ["#4f6959", "#b8c9a9", "#e8d7b7"] },
  { id: "berry", label: "로즈베리", icon: "✦", colors: ["#9a5f73", "#e3b6c2", "#d8ccec"] },
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
  dusk: { ink: "#332f3d", muted: "#77727f", paper: "#f5f2f8", white: "#fffdfd", line: "#e5dfeb", lime: "#746391", limeDark: "#5f507a", orange: "#d9828e", blue: "#caddea" },
  warm: { ink: "#28342f", muted: "#77756f", paper: "#f8f4ee", white: "#fffdf9", line: "#e8dfd5", lime: "#e9866c", limeDark: "#ca6d58", orange: "#e9866c", blue: "#c9d9cd" },
  ocean: { ink: "#1c2b30", muted: "#6d7e82", paper: "#eef6f5", white: "#ffffff", line: "#d9e7e5", lime: "#4f7890", limeDark: "#3d5f74", orange: "#e0a458", blue: "#b7d9d4" },
  forest: { ink: "#26301f", muted: "#71785f", paper: "#f2f5ec", white: "#ffffff", line: "#dfe6d2", lime: "#4f6959", limeDark: "#3c5245", orange: "#c98a4b", blue: "#b8c9a9" },
  berry: { ink: "#372631", muted: "#84717f", paper: "#f8f0f4", white: "#ffffff", line: "#ecdce4", lime: "#9a5f73", limeDark: "#7d4c5d", orange: "#d97fa0", blue: "#e3b6c2" },
};
