import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "expo-router";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { seedConversations, seedNotices, seedOffers, seedPosts, seedReports } from "@/src/constants/feature-spec";
import { useAuth } from "@/src/state/AuthContext";
import { useToast } from "@/src/state/ToastContext";
import { timeAgo, uid } from "@/src/utils/format";
import type { AppNotice, Conversation, Offer, Post, PostType, ReportReason, ReportStatus, UserReport } from "@/src/types/findgoo";

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

// [DB 행 → 화면 타입] posts 테이블의 한 행을, 화면들이 원래 쓰던 Post 모양으로 바꿔줍니다.
type PostRow = {
  id: string;
  author_id: string;
  author: string;
  type: PostType;
  category: string;
  title: string;
  description: string;
  price: number;
  region: string;
  deadline: string | null;
  status: Post["status"];
  manner: number;
  views: number;
  offer_count: number;
  created_at: string;
};

function mapPostRow(row: PostRow, myUserId?: string): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    type: row.type,
    category: row.category,
    title: row.title,
    description: row.description,
    price: row.price,
    region: row.region,
    deadline: row.deadline ?? undefined,
    author: row.author,
    manner: row.manner,
    views: row.views,
    offerCount: row.offer_count,
    created: timeAgo(row.created_at),
    status: row.status,
    mine: myUserId != null && row.author_id === myUserId,
  };
}

// [DB 행 → 화면 타입] conversations 테이블의 한 행을 화면이 쓰는 Conversation 모양으로 바꿔줍니다.
type ConversationRow = {
  id: string;
  post_id: string;
  seller_id: string;
  buyer_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  post: { id: string; title: string; price: number } | null;
};

function mapConversationRow(row: ConversationRow, myId: string, profileNames: Map<string, string>): Conversation {
  const counterpartyId = row.seller_id === myId ? row.buyer_id : row.seller_id;
  return {
    id: row.id,
    postId: row.post_id,
    postTitle: row.post?.title ?? "삭제된 게시글",
    postPrice: row.post?.price ?? 0,
    sellerId: row.seller_id,
    buyerId: row.buyer_id,
    counterpartyId,
    counterpartyName: profileNames.get(counterpartyId) ?? "상대방",
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
  };
}

type MessageRow = { id: string; conversation_id: string; sender_id: string; text: string; created_at: string };

type AppDataContextValue = {
  nickname: string;
  region: string;
  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => void;
  posts: Post[];
  addPost: (input: NewPostInput) => Promise<{ error: string | null }>;
  savedPostIds: string[];
  toggleSaved: (postId: string) => void;
  conversations: Conversation[];
  startOrGetConversation: (post: Post) => Promise<{ conversationId: string | null; error: string | null }>;
  unreadConversationIds: Set<string>;
  setActiveConversationId: (conversationId: string | null) => void;
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

// [기기 상태] 게시글/찜/대화방은 Supabase와 연결돼 여러 사용자가 같은 데이터를 봅니다.
// 채팅 메시지 자체는 대화방 화면에서 그때그때 불러와요(전역에 다 들고 있지 않음).
// 제안·신고·알림은 아직 DB로 옮기기 전이라 메모리 상태만으로 화면끼리 공유합니다.
// Supabase 환경변수가 없는 로컬 베타에서는 그대로 시드 데이터로 동작합니다.
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();
  const { showNotification } = useToast();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(isSupabaseConfigured ? [] : seedPosts);
  const [savedPostIds, setSavedPostIds] = useState<string[]>(isSupabaseConfigured ? [] : ["buy-ipad", "urgent-line", "buy-bag", "urgent-dog"]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([profile?.region || "대전 유성구 봉명동"]);
  const [conversations, setConversations] = useState<Conversation[]>(isSupabaseConfigured ? [] : seedConversations);
  const [unreadConversationIds, setUnreadConversationIds] = useState<Set<string>>(new Set());
  const [offers, setOffers] = useState<Offer[]>(seedOffers);
  const [reports, setReports] = useState<UserReport[]>(seedReports);
  const [notices, setNotices] = useState<AppNotice[]>(seedNotices);

  const myUserId = session?.user.id;

  // 실시간 구독 콜백 안에서 최신 값을 읽기 위한 ref들 (state를 그대로 쓰면
  // 구독을 새로 걸지 않는 한 처음 값에 갇혀버려요).
  const activeConversationIdRef = useRef<string | null>(null);
  const conversationsRef = useRef<Conversation[]>(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const setActiveConversationId = useCallback((conversationId: string | null) => {
    activeConversationIdRef.current = conversationId;
    if (conversationId) {
      setUnreadConversationIds((ids) => {
        if (!ids.has(conversationId)) return ids;
        const next = new Set(ids);
        next.delete(conversationId);
        return next;
      });
    }
  }, []);

  // [게시글 불러오기] 로그인하면 전체 게시글을 가져오고, 이후 다른 사용자가 새로 올린 글도
  // Realtime 구독으로 실시간으로 받아옵니다.
  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;

    let cancelled = false;

    supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setPosts((data as PostRow[]).map((row) => mapPostRow(row, myUserId)));
      });

    const channel = supabase
      .channel("posts-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) => {
        const row = payload.new as PostRow;
        setPosts((items) => (items.some((post) => post.id === row.id) ? items : [mapPostRow(row, myUserId), ...items]));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, myUserId]);

  // [찜한 글 불러오기] 내 saved_posts 목록만 가져옵니다.
  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", session.user.id)
      .then(({ data, error }) => {
        if (error || !data) return;
        setSavedPostIds(data.map((row) => row.post_id as string));
      });
  }, [session]);

  // [대화방 목록 불러오기] 내가 판매자거나 구매자인 대화방을 모두 가져오고,
  // 새 대화방이 열리거나 메시지가 와서 last_message가 바뀌면 실시간으로 다시 불러옵니다.
  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    let cancelled = false;
    const myId = session.user.id;

    async function load() {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, post:posts(id, title, price)")
        .or(`seller_id.eq.${myId},buyer_id.eq.${myId}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (cancelled || error || !data) return;

      const rows = data as ConversationRow[];
      const counterpartyIds = [...new Set(rows.map((row) => (row.seller_id === myId ? row.buyer_id : row.seller_id)))];
      let profileNames = new Map<string, string>();
      if (counterpartyIds.length > 0) {
        const { data: profileRows } = await supabase.from("profiles").select("id, nickname, name").in("id", counterpartyIds);
        profileNames = new Map((profileRows ?? []).map((row) => [row.id as string, (row.nickname as string) || (row.name as string) || "상대방"]));
      }
      if (cancelled) return;
      setConversations(rows.map((row) => mapConversationRow(row, myId, profileNames)));
    }

    load();

    const channel = supabase
      .channel("conversations-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session]);

  // [새 메시지 전역 알림] 어느 화면에 있든, 남이 보낸 메시지가 오면 목록의 최근 메시지를 갱신하고,
  // 지금 그 대화방을 보고 있는 게 아니면 상단 알림 배너로 알려주고 안 읽음 표시를 남깁니다.
  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    const myId = session.user.id;

    const channel = supabase
      .channel("messages-global")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const row = payload.new as MessageRow;
        if (row.sender_id === myId) return;

        setConversations((items) =>
          items.map((item) => (item.id === row.conversation_id ? { ...item, lastMessage: row.text, lastMessageAt: row.created_at } : item)),
        );

        if (activeConversationIdRef.current === row.conversation_id) return;

        setUnreadConversationIds((ids) => new Set(ids).add(row.conversation_id));

        const conversation = conversationsRef.current.find((item) => item.id === row.conversation_id);
        showNotification({
          title: conversation ? `${conversation.counterpartyName} 님` : "새 메시지",
          body: row.text,
          onPress: () => router.push(`/chat/${row.conversation_id}`),
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, showNotification, router]);

  const addPost = useCallback(
    async (input: NewPostInput) => {
      const authorName = profile?.nickname || profile?.name || "회원";

      if (!isSupabaseConfigured || !session) {
        const post: Post = {
          id: uid(),
          ...input,
          author: authorName,
          manner: 36.5,
          views: 0,
          offerCount: 0,
          created: "방금 전",
          status: "open",
          mine: true,
        };
        setPosts((items) => [post, ...items]);
        return { error: null };
      }

      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: session.user.id,
          author: authorName,
          type: input.type,
          category: input.category,
          title: input.title,
          description: input.description,
          price: input.price,
          region: input.region,
          deadline: input.deadline ?? null,
        })
        .select("*")
        .single();

      if (error || !data) {
        return { error: error?.message ?? "게시글 등록에 실패했어요." };
      }
      setPosts((items) => [mapPostRow(data as PostRow, session.user.id), ...items]);
      return { error: null };
    },
    [profile, session],
  );

  const toggleSaved = useCallback(
    (postId: string) => {
      const alreadySaved = savedPostIds.includes(postId);
      setSavedPostIds((ids) => (alreadySaved ? ids.filter((id) => id !== postId) : [...ids, postId]));

      if (!isSupabaseConfigured || !session) return;
      if (alreadySaved) {
        supabase
          .from("saved_posts")
          .delete()
          .eq("user_id", session.user.id)
          .eq("post_id", postId)
          .then(({ error }) => {
            if (error) console.log("[saved_posts] 삭제 실패", error.message);
          });
      } else {
        supabase
          .from("saved_posts")
          .insert({ user_id: session.user.id, post_id: postId })
          .then(({ error }) => {
            if (error) console.log("[saved_posts] 추가 실패", error.message);
          });
      }
    },
    [savedPostIds, session],
  );

  // [채팅 시작] 이 글에 대해 나(구매자)와 글쓴이 사이의 대화방을 찾고, 없으면 새로 만듭니다.
  const startOrGetConversation = useCallback(
    async (post: Post): Promise<{ conversationId: string | null; error: string | null }> => {
      if (!isSupabaseConfigured || !session) {
        const local = conversations.find((c) => c.postId === post.id);
        return local ? { conversationId: local.id, error: null } : { conversationId: null, error: "로그인이 필요해요." };
      }
      if (post.mine || !post.authorId) return { conversationId: null, error: "본인 글에는 채팅을 시작할 수 없어요." };

      const myId = session.user.id;
      const existing = conversations.find((c) => c.postId === post.id && c.buyerId === myId);
      if (existing) return { conversationId: existing.id, error: null };

      const { data, error } = await supabase
        .from("conversations")
        .insert({ post_id: post.id, seller_id: post.authorId, buyer_id: myId })
        .select("*, post:posts(id, title, price)")
        .single();

      if (error?.code === "23505") {
        // 이미 만들어진 대화방이 있었어요 (동시 요청 등). 그 방을 다시 찾아옵니다.
        const { data: existingRow } = await supabase
          .from("conversations")
          .select("*, post:posts(id, title, price)")
          .eq("post_id", post.id)
          .eq("buyer_id", myId)
          .single();
        if (existingRow) {
          const row = existingRow as ConversationRow;
          const conversation = mapConversationRow(row, myId, new Map([[post.authorId, post.author]]));
          setConversations((items) => (items.some((c) => c.id === conversation.id) ? items : [conversation, ...items]));
          return { conversationId: row.id, error: null };
        }
      }

      if (error || !data) return { conversationId: null, error: error?.message ?? "채팅을 시작하지 못했어요." };

      const row = data as ConversationRow;
      const conversation = mapConversationRow(row, myId, new Map([[post.authorId, post.author]]));
      setConversations((items) => [conversation, ...items]);
      return { conversationId: row.id, error: null };
    },
    [session, conversations],
  );

  const updateOfferStatus = useCallback((offerId: string, status: Offer["status"]) => {
    setOffers((items) => items.map((offer) => (offer.id === offerId ? { ...offer, status } : offer)));
  }, []);

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
      conversations,
      startOrGetConversation,
      unreadConversationIds,
      setActiveConversationId,
      offers,
      updateOfferStatus,
      reports,
      addReport,
      updateReportStatus,
      notices,
      markNoticeRead,
      unreadNoticeCount,
    }),
    [
      profile,
      selectedRegions,
      posts,
      addPost,
      savedPostIds,
      toggleSaved,
      conversations,
      startOrGetConversation,
      unreadConversationIds,
      setActiveConversationId,
      offers,
      updateOfferStatus,
      reports,
      addReport,
      updateReportStatus,
      notices,
      markNoticeRead,
      unreadNoticeCount,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData는 AppDataProvider 안에서만 사용할 수 있어요.");
  return context;
}
