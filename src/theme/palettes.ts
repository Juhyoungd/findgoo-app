import type { ThemeId } from "@/src/types/findgoo";

export type ThemeOption = {
  id: ThemeId;
  label: string;
  colors: readonly [string, string, string];
};

// [앱 색상] 모든 테마는 주색·보조색·배경 블롭의 세 색을 한 묶음으로 관리합니다.
export const themeOptions: readonly ThemeOption[] = [
  { id: "apricot", label: "살구 크림", colors: ["#e88870", "#f8d9cc", "#d9e4dc"] },
  { id: "rosewater", label: "로즈 워터", colors: ["#cf7f91", "#f4dce2", "#e7ddd6"] },
  { id: "butter", label: "바닐라 버터", colors: ["#be8a45", "#f5e5bd", "#dce4cf"] },
  { id: "lavender", label: "라벤더 솜", colors: ["#8776aa", "#e8e0f2", "#dce5ed"] },
  { id: "pistachio", label: "피스타치오 크림", colors: ["#718b78", "#dce8d7", "#f1dfca"] },
  { id: "mintNavy", label: "네이비 민트", colors: ["#395a69", "#cfe8de", "#dbe5ef"] },
  { id: "sunsetPurple", label: "선셋 퍼플", colors: ["#8b6aa9", "#f1d2ca", "#e2d9ef"] },
  { id: "coralSky", label: "코랄 스카이", colors: ["#d8746c", "#d9e9f3", "#f4d8cf"] },
  { id: "plumPeach", label: "플럼 피치", colors: ["#805d79", "#f1d4c5", "#eaddeb"] },
  { id: "oceanSand", label: "오션 샌드", colors: ["#477b86", "#eadfc7", "#d7e8e8"] },
  { id: "sageRose", label: "세이지 로즈", colors: ["#6f8774", "#efd9dd", "#dce8d8"] },
  { id: "cobaltLilac", label: "코발트 라일락", colors: ["#566f9c", "#e4dcf0", "#dbe6f2"] },
  { id: "mochaBlush", label: "모카 블러시", colors: ["#8a6b5d", "#f0dadd", "#eadfce"] },
  { id: "forestCream", label: "포레스트 크림", colors: ["#4f7461", "#f1e5c9", "#d9e7dd"] },
  { id: "amberTeal", label: "앰버 틸", colors: ["#a66f3f", "#d8e9e4", "#f1dfbd"] },
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

export const palettes: Record<ThemeId, ThemePalette> = {
  apricot: { ink: "#332d2a", muted: "#81756f", paper: "#fcf6f1", white: "#fffdfb", line: "#ecdfd6", lime: "#e88870", limeDark: "#ca6d57", orange: "#d96f62", blue: "#f8d9cc" },
  rosewater: { ink: "#352d31", muted: "#84767b", paper: "#fcf5f7", white: "#fffdfd", line: "#eedfe3", lime: "#cf7f91", limeDark: "#ad6275", orange: "#d67573", blue: "#f4dce2" },
  butter: { ink: "#342f27", muted: "#827a6c", paper: "#fdf9ee", white: "#fffefa", line: "#ece4d2", lime: "#be8a45", limeDark: "#9f6f35", orange: "#d2785f", blue: "#f5e5bd" },
  lavender: { ink: "#302d38", muted: "#7b7584", paper: "#faf7fc", white: "#fffefe", line: "#e9e2ee", lime: "#8776aa", limeDark: "#6d5b91", orange: "#cf7e8e", blue: "#e8e0f2" },
  pistachio: { ink: "#2d332e", muted: "#758078", paper: "#f7faf4", white: "#fffefa", line: "#e1e8dc", lime: "#718b78", limeDark: "#587061", orange: "#d18463", blue: "#dce8d7" },
  mintNavy: { ink: "#21343d", muted: "#708088", paper: "#f3f8f7", white: "#fcfffe", line: "#dce9e5", lime: "#46786f", limeDark: "#325c58", orange: "#d17b68", blue: "#cfe8de" },
  sunsetPurple: { ink: "#352e3d", muted: "#7d7184", paper: "#faf6fb", white: "#fffdfd", line: "#e9e0ec", lime: "#8b6aa9", limeDark: "#6d508c", orange: "#d67c73", blue: "#f1d2ca" },
  coralSky: { ink: "#31343a", muted: "#747d85", paper: "#f7fafc", white: "#ffffff", line: "#dfe8ed", lime: "#d8746c", limeDark: "#b85b55", orange: "#cf675f", blue: "#d9e9f3" },
  plumPeach: { ink: "#392f38", muted: "#82747f", paper: "#fbf6f8", white: "#fffdfd", line: "#ebdfe5", lime: "#805d79", limeDark: "#65455f", orange: "#d98268", blue: "#f1d4c5" },
  oceanSand: { ink: "#29393b", muted: "#728082", paper: "#f6f9f7", white: "#fffefa", line: "#dfe7e3", lime: "#477b86", limeDark: "#35616b", orange: "#cb8066", blue: "#eadfc7" },
  sageRose: { ink: "#303831", muted: "#758078", paper: "#f7faf6", white: "#fffdfb", line: "#e0e9df", lime: "#6f8774", limeDark: "#566b5b", orange: "#c77b85", blue: "#efd9dd" },
  cobaltLilac: { ink: "#2e3340", muted: "#747b89", paper: "#f6f7fb", white: "#fefeff", line: "#e0e3ee", lime: "#566f9c", limeDark: "#405782", orange: "#c97882", blue: "#e4dcf0" },
  mochaBlush: { ink: "#382f2b", muted: "#81756e", paper: "#faf7f3", white: "#fffefa", line: "#e9e1d9", lime: "#8a6b5d", limeDark: "#6e5145", orange: "#ca7880", blue: "#f0dadd" },
  forestCream: { ink: "#29362f", muted: "#718078", paper: "#f6f9f4", white: "#fffefa", line: "#dee7dc", lime: "#4f7461", limeDark: "#395847", orange: "#ca7d63", blue: "#f1e5c9" },
  amberTeal: { ink: "#352f29", muted: "#7d776f", paper: "#faf8f1", white: "#fffefa", line: "#e8e2d6", lime: "#a66f3f", limeDark: "#815431", orange: "#c96e58", blue: "#d8e9e4" },
};
