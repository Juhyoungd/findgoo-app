// [하단 메뉴 아이콘]
// 공통 선형 아이콘 컴포넌트에서 사용할 이름을 한 곳에서 관리합니다.
export const appIcons = {
  home: "home",
  urgent: "urgent",
  buy: "search",
  search: "search",
  create: "create",
  chat: "chat",
  bell: "bell",
  saved: "saved",
  back: "back",
  send: "send",
  close: "close",
  done: "done",
} as const;

export type AppIconName = (typeof appIcons)[keyof typeof appIcons];
