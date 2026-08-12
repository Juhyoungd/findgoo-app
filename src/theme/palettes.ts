import type { ThemeId } from "@/src/types/findgoo";

// [앱 색상]
// 색상 이름, 아이콘, 마이페이지 미리보기 색을 한 곳에서 관리합니다.
export const themeOptions: ReadonlyArray<{
  id: ThemeId;
  label: string;
  icon: string;
  colors: readonly [string, string, string];
}> = [
  { id: "apricot", label: "살구 크림", icon: "", colors: ["#e88870", "#f8d9cc", "#d9e4dc"] },
  { id: "rosewater", label: "로즈 워터", icon: "", colors: ["#cf7f91", "#f4dce2", "#e7ddd6"] },
  { id: "butter", label: "바닐라 버터", icon: "", colors: ["#be8a45", "#f5e5bd", "#dce4cf"] },
  { id: "lavender", label: "라벤더 솜", icon: "", colors: ["#8776aa", "#e8e0f2", "#dce5ed"] },
  { id: "pistachio", label: "피스타치오 크림", icon: "", colors: ["#718b78", "#dce8d7", "#f1dfca"] },
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
  apricot: { ink: "#332d2a", muted: "#81756f", paper: "#fcf6f1", white: "#fffdfb", line: "#ecdfd6", lime: "#e88870", limeDark: "#ca6d57", orange: "#d96f62", blue: "#f8d9cc" },
  rosewater: { ink: "#352d31", muted: "#84767b", paper: "#fcf5f7", white: "#fffdfd", line: "#eedfe3", lime: "#cf7f91", limeDark: "#ad6275", orange: "#d67573", blue: "#f4dce2" },
  butter: { ink: "#342f27", muted: "#827a6c", paper: "#fdf9ee", white: "#fffefa", line: "#ece4d2", lime: "#be8a45", limeDark: "#9f6f35", orange: "#d2785f", blue: "#f5e5bd" },
  lavender: { ink: "#302d38", muted: "#7b7584", paper: "#faf7fc", white: "#fffefe", line: "#e9e2ee", lime: "#8776aa", limeDark: "#6d5b91", orange: "#cf7e8e", blue: "#e8e0f2" },
  pistachio: { ink: "#2d332e", muted: "#758078", paper: "#f7faf4", white: "#fffefa", line: "#e1e8dc", lime: "#718b78", limeDark: "#587061", orange: "#d18463", blue: "#dce8d7" },
};
