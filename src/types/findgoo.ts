// [공통 타입] 화면과 API가 함께 사용하는 데이터 모양을 한곳에서 관리합니다.
export type PostType = "buy" | "urgent";
export type PostStatus = "open" | "reserved" | "closed";
export type ThemeId = "dusk" | "warm" | "ocean" | "forest" | "berry";
export type BottomNavKey = "home" | "urgent" | "create" | "chat" | "my";

export type Post = {
  id: string;
  type: PostType;
  category: string;
  title: string;
  description: string;
  price: number;
  region: string;
  deadline?: string;
  author: string;
  manner: number;
  views: number;
  offerCount: number;
  created: string;
  status: PostStatus;
  mine?: boolean;
};

export type Offer = {
  id: string;
  postId: string;
  nickname: string;
  price: number;
  message: string;
  direction: "incoming" | "outgoing";
  status: "pending" | "accepted" | "canceled" | "rejected";
};

export type ChatMessage = {
  id: string;
  postId: string;
  sender: "me" | "partner";
  text: string;
  time: string;
  imageUrl?: string;
};

export type AppNotice = {
  id: string;
  kind: "offer" | "trade" | "chat" | "favorite" | "keyword" | "urgent" | "system";
  title: string;
  body: string;
  time: string;
  read: boolean;
  postId?: string;
};

export type Viewer = {
  userId: string;
  displayName: string;
  email: string;
} | null;
