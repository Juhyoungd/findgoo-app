import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { seedMessages, seedNotices, seedPosts } from "@/src/constants/feature-spec";
import { uid } from "@/src/utils/format";
import type { AppNotice, ChatMessage, Post, PostType } from "@/src/types/findgoo";

type NewPostInput = {
  type: PostType;
  category: string;
  title: string;
  description: string;
  price: number;
  region: string;
  deadline?: string;
};

type AppDataContextValue = {
  nickname: string;
  region: string;
  posts: Post[];
  addPost: (input: NewPostInput) => void;
  savedPostIds: string[];
  toggleSaved: (postId: string) => void;
  messages: ChatMessage[];
  sendMessage: (postId: string, text: string) => void;
  notices: AppNotice[];
  markNoticeRead: (noticeId: string) => void;
  unreadNoticeCount: number;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

// [기기 상태] 웹의 useFindgooDeviceState를 단순화한 버전. 아직 서버/로컬 저장소 없이
// 메모리 상태만으로 등록·채팅·마이페이지 화면이 같은 데이터를 공유하게 합니다.
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(seedPosts);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [notices, setNotices] = useState<AppNotice[]>(seedNotices);

  const addPost = useCallback((input: NewPostInput) => {
    const post: Post = {
      id: uid(),
      ...input,
      author: "베타사용자",
      manner: 36.5,
      views: 0,
      offerCount: 0,
      created: "방금 전",
      status: "open",
      mine: true,
    };
    setPosts((items) => [post, ...items]);
  }, []);

  const toggleSaved = useCallback((postId: string) => {
    setSavedPostIds((ids) => (ids.includes(postId) ? ids.filter((id) => id !== postId) : [...ids, postId]));
  }, []);

  const sendMessage = useCallback((postId: string, text: string) => {
    if (!text.trim()) return;
    setMessages((items) => [...items, { id: uid(), postId, sender: "me", text: text.trim(), time: "방금 전" }]);
  }, []);

  const markNoticeRead = useCallback((noticeId: string) => {
    setNotices((items) => items.map((notice) => (notice.id === noticeId ? { ...notice, read: true } : notice)));
  }, []);

  const unreadNoticeCount = useMemo(() => notices.filter((notice) => !notice.read).length, [notices]);

  const value = useMemo(
    () => ({
      nickname: "베타사용자",
      region: "성수동1가",
      posts,
      addPost,
      savedPostIds,
      toggleSaved,
      messages,
      sendMessage,
      notices,
      markNoticeRead,
      unreadNoticeCount,
    }),
    [posts, addPost, savedPostIds, toggleSaved, messages, sendMessage, notices, markNoticeRead, unreadNoticeCount],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData는 AppDataProvider 안에서만 사용할 수 있어요.");
  return context;
}
