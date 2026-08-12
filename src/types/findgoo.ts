// [공통 타입] 화면과 API가 함께 사용하는 데이터 모양을 한곳에서 관리합니다.
export type PostType = "buy" | "urgent";
export type PostStatus = "open" | "reserved" | "closed";
export type ThemeId = "apricot" | "rosewater" | "butter" | "lavender" | "pistachio";
export type BottomNavKey = "home" | "urgent" | "create" | "chat" | "my";

export type Post = {
  id: string;
  authorId?: string;
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
  created: string;
};

export type ReportReason = "사기 의심" | "욕설·비방" | "거래 불이행" | "부적절한 상품" | "기타";
export type ReportStatus = "pending" | "reviewing" | "resolved";

export type UserReport = {
  id: string;
  postId: string;
  reporter: string;
  reportedUser: string;
  reason: ReportReason;
  detail: string;
  created: string;
  status: ReportStatus;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  time: string;
  mine: boolean;
};

export type Conversation = {
  id: string;
  postId: string;
  postTitle: string;
  postPrice: number;
  sellerId: string;
  buyerId: string;
  counterpartyId: string;
  counterpartyName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

export type AppNotice = {
  id: string;
  kind: "offer" | "trade" | "chat" | "favorite" | "keyword" | "urgent" | "system";
  title: string;
  body: string;
  time: string;
  read: boolean;
  postId?: string;
  target:
    | { type: "post"; postId: string }
    | { type: "offer"; offerId: string }
    | { type: "chat"; conversationId: string }
    | { type: "transactions" }
    | { type: "region" };
};

export type Viewer = {
  userId: string;
  displayName: string;
  email: string;
} | null;
