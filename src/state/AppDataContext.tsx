import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { seedMessages, seedNotices, seedOffers, seedPosts, seedReports } from "@/src/constants/feature-spec";
import { useAuth } from "@/src/state/AuthContext";
import { uid } from "@/src/utils/format";
import type { AppNotice, ChatMessage, Offer, Post, PostType, ReportReason, ReportStatus, UserReport } from "@/src/types/findgoo";

type NewPostInput = {
  type: PostType;
  category: string;
  title: string;
  description: string;
  price: number;
  region: string;
  deadline?: string;
};

type NewReportInput = {
  postId: string;
  reportedUser: string;
  reason: ReportReason;
  detail: string;
};

type AppDataContextValue = {
  nickname: string;
  region: string;
  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => void;
  posts: Post[];
  addPost: (input: NewPostInput) => void;
  savedPostIds: string[];
  toggleSaved: (postId: string) => void;
  messages: ChatMessage[];
  sendMessage: (postId: string, text: string) => void;
  offers: Offer[];
  updateOfferStatus: (offerId: string, status: Offer["status"]) => void;
  reports: UserReport[];
  addReport: (input: NewReportInput) => void;
  updateReportStatus: (reportId: string, status: ReportStatus) => void;
  notices: AppNotice[];
  markNoticeRead: (noticeId: string) => void;
  unreadNoticeCount: number;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

// [기기 상태] 웹의 useFindgooDeviceState를 단순화한 버전. 아직 서버/로컬 저장소 없이
// 메모리 상태만으로 등록·채팅·마이페이지 화면이 같은 데이터를 공유하게 합니다.
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>(seedPosts);
  const [savedPostIds, setSavedPostIds] = useState<string[]>(["buy-ipad", "urgent-line", "buy-bag", "urgent-dog"]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([profile?.region || "대전 유성구 봉명동"]);
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [offers, setOffers] = useState<Offer[]>(seedOffers);
  const [reports, setReports] = useState<UserReport[]>(seedReports);
  const [notices, setNotices] = useState<AppNotice[]>(seedNotices);

  const addPost = useCallback(
    (input: NewPostInput) => {
      const post: Post = {
        id: uid(),
        ...input,
        author: profile?.nickname || profile?.name || "회원",
        manner: 36.5,
        views: 0,
        offerCount: 0,
        created: "방금 전",
        status: "open",
        mine: true,
      };
      setPosts((items) => [post, ...items]);
    },
    [profile],
  );

  const toggleSaved = useCallback((postId: string) => {
    setSavedPostIds((ids) => (ids.includes(postId) ? ids.filter((id) => id !== postId) : [...ids, postId]));
  }, []);

  const sendMessage = useCallback((postId: string, text: string) => {
    if (!text.trim()) return;
    setMessages((items) => [...items, { id: uid(), postId, sender: "me", text: text.trim(), time: "방금 전" }]);
  }, []);

  const updateOfferStatus = useCallback(
    (offerId: string, status: Offer["status"]) => {
      const target = offers.find((offer) => offer.id === offerId);
      setOffers((items) => items.map((offer) => (offer.id === offerId ? { ...offer, status } : offer)));

      // [제안 수락] 수락된 거래에 기존 채팅이 없으면 1:1 채팅방을 바로 생성합니다.
      if (status === "accepted" && target) {
        setMessages((items) => {
          if (items.some((message) => message.postId === target.postId)) return items;
          return [...items, { id: uid(), postId: target.postId, sender: "partner", text: "제안이 수락됐어요. 거래 시간과 장소를 정해볼까요?", time: "방금 전" }];
        });
      }
    },
    [offers],
  );

  const addReport = useCallback(
    (input: NewReportInput) => {
      setReports((items) => [
        {
          id: uid(),
          ...input,
          reporter: profile?.nickname || profile?.name || "회원",
          created: "방금 전",
          status: "pending",
        },
        ...items,
      ]);
    },
    [profile],
  );

  const updateReportStatus = useCallback((reportId: string, status: ReportStatus) => {
    setReports((items) => items.map((report) => (report.id === reportId ? { ...report, status } : report)));
  }, []);

  const markNoticeRead = useCallback((noticeId: string) => {
    setNotices((items) => items.map((notice) => (notice.id === noticeId ? { ...notice, read: true } : notice)));
  }, []);

  const unreadNoticeCount = useMemo(() => notices.filter((notice) => !notice.read).length, [notices]);

  const value = useMemo(
    () => ({
      nickname: profile?.nickname || profile?.name || "회원",
      region: selectedRegions[0] || "대전 유성구 봉명동",
      selectedRegions,
      setSelectedRegions,
      posts,
      addPost,
      savedPostIds,
      toggleSaved,
      messages,
      sendMessage,
      offers,
      updateOfferStatus,
      reports,
      addReport,
      updateReportStatus,
      notices,
      markNoticeRead,
      unreadNoticeCount,
    }),
    [profile, selectedRegions, posts, addPost, savedPostIds, toggleSaved, messages, sendMessage, offers, updateOfferStatus, reports, addReport, updateReportStatus, notices, markNoticeRead, unreadNoticeCount],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData는 AppDataProvider 안에서만 사용할 수 있어요.");
  return context;
}
