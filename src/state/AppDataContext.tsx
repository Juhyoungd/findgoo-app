import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { seedConversations, seedNotices, seedOffers, seedPosts, seedReports } from "@/src/constants/feature-spec";
import { createFallbackMemberProfile } from "@/src/constants/member-profiles";
import { useAuth } from "@/src/state/AuthContext";
import { useToast } from "@/src/state/ToastContext";
import { timeAgo, uid } from "@/src/utils/format";
import type { AppNotice, Conversation, MemberProfile, Offer, Post, PostType, ReportReason, ReportStatus, Transaction, TransactionStatus, UserReport } from "@/src/types/findgoo";

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
  reportedUserId?: string;
  reportedUser: string;
  reason: ReportReason;
  detail: string;
};

type NewOfferInput = {
  postId: string;
  price: number;
  message: string;
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
  seller_last_read_at: string | null;
  buyer_last_read_at: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  post: { id: string; title: string; price: number } | null;
};

function mapConversationRow(row: ConversationRow, myId: string, profiles: Map<string, MemberProfile>): Conversation {
  const counterpartyId = row.seller_id === myId ? row.buyer_id : row.seller_id;
  const counterpartyLastReadAt = row.seller_id === myId ? row.buyer_last_read_at : row.seller_last_read_at;
  const counterpartyProfile = profiles.get(counterpartyId) ?? createFallbackMemberProfile(counterpartyId);
  return {
    id: row.id,
    postId: row.post_id,
    postTitle: row.post?.title ?? "삭제된 게시글",
    postPrice: row.post?.price ?? 0,
    sellerId: row.seller_id,
    buyerId: row.buyer_id,
    counterpartyLastReadAt,
    counterpartyId,
    counterpartyName: counterpartyProfile.nickname,
    counterpartyProfile,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
  };
}

type MessageRow = { id: string; conversation_id: string; sender_id: string; text: string; created_at: string };
type PublicProfileRow = {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  region: string | null;
  created_at: string;
  completed_trades: number;
  good_manner_reviews: number;
  urgent_successes: number;
  manner_reports: number;
};

const SAVED_POSTS_KEY = "@findgoo/saved-post-ids";

// [DB 행 → 화면 타입] offers/reports/notices 테이블의 한 행을 화면이 쓰는 모양으로 바꿔줍니다.
type OfferRow = {
  id: string;
  post_id: string;
  offerer_id: string;
  offerer_nickname: string;
  price: number;
  message: string;
  status: Offer["status"];
  created_at: string;
};

function mapOfferRow(row: OfferRow, myId: string): Offer {
  return {
    id: row.id,
    postId: row.post_id,
    offererId: row.offerer_id,
    nickname: row.offerer_nickname,
    price: row.price,
    message: row.message,
    direction: row.offerer_id === myId ? "outgoing" : "incoming",
    status: row.status,
    created: timeAgo(row.created_at),
  };
}

type ReportRow = {
  id: string;
  post_id: string;
  reporter_name: string;
  reported_user: string;
  reported_user_id?: string | null;
  reason: ReportReason;
  detail: string;
  status: ReportStatus;
  created_at: string;
};

function mapReportRow(row: ReportRow): UserReport {
  return {
    id: row.id,
    postId: row.post_id,
    reporter: row.reporter_name,
    reportedUser: row.reported_user,
    reportedUserId: row.reported_user_id,
    reason: row.reason,
    detail: row.detail,
    created: timeAgo(row.created_at),
    status: row.status,
  };
}

type NoticeRow = {
  id: string;
  kind: AppNotice["kind"];
  title: string;
  body: string;
  read: boolean;
  target_type: "post" | "offer" | "chat" | "transactions" | "region";
  target_id: string | null;
  created_at: string;
};

type TransactionRow = {
  id: string;
  post_id: string;
  offer_id: string;
  seller_id: string;
  buyer_id: string;
  status: TransactionStatus;
  created_at: string;
  completed_at: string | null;
};

function mapTransactionRow(row: TransactionRow): Transaction {
  return { id: row.id, postId: row.post_id, offerId: row.offer_id, sellerId: row.seller_id, buyerId: row.buyer_id, status: row.status, createdAt: row.created_at, completedAt: row.completed_at };
}

function mapNoticeRow(row: NoticeRow): AppNotice {
  const target: AppNotice["target"] =
    row.target_type === "post" && row.target_id
      ? { type: "post", postId: row.target_id }
      : row.target_type === "offer" && row.target_id
        ? { type: "offer", offerId: row.target_id }
        : row.target_type === "chat" && row.target_id
          ? { type: "chat", conversationId: row.target_id }
          : row.target_type === "region"
            ? { type: "region" }
            : { type: "transactions" };

  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    time: timeAgo(row.created_at),
    createdAt: row.created_at,
    read: row.read,
    target,
  };
}

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
  activeConversationId: string | null;
  setActiveConversationId: (conversationId: string | null) => void;
  offers: Offer[];
  addOffer: (input: NewOfferInput) => Promise<{ error: string | null }>;
  updateOfferStatus: (offerId: string, status: Offer["status"]) => Promise<{ error: string | null }>;
  transactions: Transaction[];
  updateTransactionStatus: (transactionId: string, status: TransactionStatus) => Promise<{ error: string | null }>;
  reports: UserReport[];
  addReport: (input: NewReportInput) => Promise<{ error: string | null }>;
  updateReportStatus: (reportId: string, status: ReportStatus) => Promise<{ error: string | null }>;
  blockedMembers: MemberProfile[];
  blockMember: (profile: MemberProfile) => Promise<{ error: string | null }>;
  unblockMember: (userId: string) => Promise<{ error: string | null }>;
  notices: AppNotice[];
  markNoticeRead: (noticeId: string) => void;
  unreadNoticeCount: number;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

// [기기 상태] 게시글/찜/대화방/제안/신고/알림 모두 Supabase와 연결돼 여러 사용자가 같은 데이터를 봅니다.
// 채팅 메시지 자체는 대화방 화면에서 그때그때 불러와요(전역에 다 들고 있지 않음).
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
  const [offers, setOffers] = useState<Offer[]>(isSupabaseConfigured ? [] : seedOffers);
  const [transactions, setTransactions] = useState<Transaction[]>(isSupabaseConfigured ? [] : seedOffers.filter((offer) => offer.status === "accepted").map((offer, index) => {
    const post = seedPosts.find((item) => item.id === offer.postId);
    return {
      id: `demo-transaction-${index + 1}`,
      postId: offer.postId,
      offerId: offer.id,
      sellerId: post?.authorId ?? "demo-seller",
      buyerId: offer.offererId ?? "demo-buyer",
      status: "accepted" as const,
      createdAt: new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString(),
    };
  }));
  const [reports, setReports] = useState<UserReport[]>(isSupabaseConfigured ? [] : seedReports);
  const [notices, setNotices] = useState<AppNotice[]>(isSupabaseConfigured ? [] : seedNotices);
  const [blockedMembers, setBlockedMembers] = useState<MemberProfile[]>([]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    AsyncStorage.getItem(SAVED_POSTS_KEY).then((value) => {
      if (value) setSavedPostIds(JSON.parse(value));
    }).catch(() => undefined);
  }, []);

  const myUserId = session?.user.id;

  // 실시간 구독 콜백 안에서 최신 값을 읽기 위한 ref들 (state를 그대로 쓰면
  // 구독을 새로 걸지 않는 한 처음 값에 갇혀버려요).
  const activeConversationIdRef = useRef<string | null>(null);
  const conversationsRef = useRef<Conversation[]>(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // 지금 어떤 대화방이 열려 있는지는 하단 탭바가 채팅방 화면에서 자기 자신을 숨길 때도 씁니다
  // (네비게이션 상태를 직접 들여다보는 것보다 이 값이 더 안정적이에요).
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);

  const setActiveConversationId = useCallback((conversationId: string | null) => {
    activeConversationIdRef.current = conversationId;
    setActiveConversationIdState(conversationId);
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

  // [거래 상태] 수락된 제안은 transactions 한 건으로 고정하고 이후 진행·완료·취소·분쟁 상태만 바꿉니다.
  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
      if (!cancelled && !error && data) setTransactions((data as TransactionRow[]).map(mapTransactionRow));
    };
    load();
    const channel = supabase.channel("transactions-changes").on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => load()).subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [session]);

  // [차단 회원] 내 차단 목록과 공개 프로필만 가져오고, 피드와 채팅 목록에서 해당 회원을 숨깁니다.
  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase.from("blocked_users").select("blocked_id").eq("blocker_id", session!.user.id);
      if (cancelled || error || !data || data.length === 0) {
        if (!cancelled && !error) setBlockedMembers([]);
        return;
      }
      const ids = data.map((row) => row.blocked_id as string);
      const { data: rows } = await supabase.rpc("get_public_profiles", { p_ids: ids });
      if (cancelled) return;
      setBlockedMembers(((rows ?? []) as PublicProfileRow[]).map((row) => ({
        id: row.id,
        nickname: row.nickname || "찾구 회원",
        avatarUrl: row.avatar_url,
        recentRegion: row.region || "대전·세종",
        joinedAt: row.created_at,
        mannerStats: { completedTrades: Number(row.completed_trades ?? 0), goodMannerReviews: Number(row.good_manner_reviews ?? 0), successfulUrgentMissions: Number(row.urgent_successes ?? 0), mannerReports: Number(row.manner_reports ?? 0) },
      })));
    }
    load();
    return () => { cancelled = true; };
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
      let publicProfiles = new Map<string, MemberProfile>();
      if (counterpartyIds.length > 0) {
        const { data: profileRows } = await supabase.rpc("get_public_profiles", { p_ids: counterpartyIds });
        publicProfiles = new Map(((profileRows ?? []) as PublicProfileRow[]).map((row) => {
          const profile: MemberProfile = {
            id: row.id as string,
            nickname: (row.nickname as string) || "찾구 회원",
            avatarUrl: (row.avatar_url as string | null) ?? null,
            recentRegion: (row.region as string) || "대전·세종",
            joinedAt: (row.created_at as string) || new Date().toISOString(),
            mannerStats: {
              completedTrades: Number(row.completed_trades ?? 0),
              goodMannerReviews: Number(row.good_manner_reviews ?? 0),
              successfulUrgentMissions: Number(row.urgent_successes ?? 0),
              mannerReports: Number(row.manner_reports ?? 0),
            },
          };
          return [profile.id, profile];
        }));
      }
      if (cancelled) return;
      setConversations(rows.map((row) => mapConversationRow(row, myId, publicProfiles)));
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

  // [제안 불러오기] 내가 받은(글쓴이) 또는 보낸(제안자) 제안을 모두 가져오고,
  // 새 제안·상태 변경을 실시간으로 반영합니다.
  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    const myId = session.user.id;
    let cancelled = false;

    supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setOffers((data as OfferRow[]).map((row) => mapOfferRow(row, myId)));
      });

    const channel = supabase
      .channel("offers-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const oldRow = payload.old as OfferRow;
          setOffers((items) => items.filter((offer) => offer.id !== oldRow.id));
          return;
        }
        const row = payload.new as OfferRow;
        const mapped = mapOfferRow(row, myId);
        setOffers((items) => (items.some((offer) => offer.id === mapped.id) ? items.map((offer) => (offer.id === mapped.id ? mapped : offer)) : [mapped, ...items]));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session]);

  // [신고 불러오기] 본인이 접수한 신고(관리자라면 전체 신고, RLS가 알아서 걸러줍니다)
  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    let cancelled = false;

    supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setReports((data as ReportRow[]).map(mapReportRow));
      });

    const channel = supabase
      .channel("reports-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const oldRow = payload.old as ReportRow;
          setReports((items) => items.filter((report) => report.id !== oldRow.id));
          return;
        }
        const mapped = mapReportRow(payload.new as ReportRow);
        setReports((items) => (items.some((report) => report.id === mapped.id) ? items.map((report) => (report.id === mapped.id ? mapped : report)) : [mapped, ...items]));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session]);

  // [알림함 불러오기] 내 알림만 가져오고, 새 알림은 실시간으로 목록 맨 위에 추가합니다.
  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    const myId = session.user.id;
    let cancelled = false;

    supabase
      .from("notices")
      .select("*")
      .eq("user_id", myId)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setNotices((data as NoticeRow[]).map(mapNoticeRow));
      });

    const channel = supabase
      .channel("notices-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "notices", filter: `user_id=eq.${myId}` }, (payload) => {
        if (payload.eventType === "DELETE") {
          const oldRow = payload.old as NoticeRow;
          setNotices((items) => items.filter((notice) => notice.id !== oldRow.id));
          return;
        }
        const mapped = mapNoticeRow(payload.new as NoticeRow);
        setNotices((items) =>
          items.some((notice) => notice.id === mapped.id)
            ? items.map((notice) => (notice.id === mapped.id ? mapped : notice))
            : [mapped, ...items],
        );
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session]);

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
      const next = alreadySaved ? savedPostIds.filter((id) => id !== postId) : [...savedPostIds, postId];
      setSavedPostIds(next);

      if (!isSupabaseConfigured || !session) {
        AsyncStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(next)).catch(() => setSavedPostIds(savedPostIds));
        return;
      }
      if (alreadySaved) {
        supabase
          .from("saved_posts")
          .delete()
          .eq("user_id", session.user.id)
          .eq("post_id", postId)
          .then(({ error }) => {
            if (error) {
              setSavedPostIds(savedPostIds);
              showNotification({ title: "찜을 변경하지 못했어요", body: "네트워크를 확인하고 다시 시도해주세요." });
            }
          });
      } else {
        supabase
          .from("saved_posts")
          .insert({ user_id: session.user.id, post_id: postId })
          .then(({ error }) => {
            if (error) {
              setSavedPostIds(savedPostIds);
              showNotification({ title: "찜을 변경하지 못했어요", body: "네트워크를 확인하고 다시 시도해주세요." });
            }
          });
      }
    },
    [savedPostIds, session, showNotification],
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
          const conversation = mapConversationRow(row, myId, new Map([[post.authorId, createFallbackMemberProfile(post.authorId, post.author)]]));
          setConversations((items) => (items.some((c) => c.id === conversation.id) ? items : [conversation, ...items]));
          return { conversationId: row.id, error: null };
        }
      }

      if (error || !data) return { conversationId: null, error: error?.message ?? "채팅을 시작하지 못했어요." };

      const row = data as ConversationRow;
      const conversation = mapConversationRow(row, myId, new Map([[post.authorId, createFallbackMemberProfile(post.authorId, post.author)]]));
      setConversations((items) => [conversation, ...items]);
      return { conversationId: row.id, error: null };
    },
    [session, conversations],
  );

  // [제안하기] 게시글에 가격·메시지를 담아 제안을 등록합니다.
  const addOffer = useCallback(
    async (input: NewOfferInput) => {
      const nickname = profile?.nickname || profile?.name || "회원";

      if (!isSupabaseConfigured || !session) {
        const offer: Offer = { id: uid(), postId: input.postId, nickname, price: input.price, message: input.message, direction: "outgoing", status: "pending", created: "방금 전" };
        setOffers((items) => [offer, ...items]);
        return { error: null };
      }

      const { data, error } = await supabase
        .from("offers")
        .insert({ post_id: input.postId, offerer_id: session.user.id, offerer_nickname: nickname, price: input.price, message: input.message })
        .select("*")
        .single();

      if (error || !data) return { error: error?.message ?? "제안을 보내지 못했어요." };
      setOffers((items) => [mapOfferRow(data as OfferRow, session.user.id), ...items]);
      return { error: null };
    },
    [profile, session],
  );

  const updateOfferStatus = useCallback(
    async (offerId: string, status: Offer["status"]) => {
      const before = offers;
      setOffers((items) => items.map((offer) => (offer.id === offerId ? { ...offer, status } : offer)));
      if (!isSupabaseConfigured || !session) {
        if (status === "accepted") {
          const offer = offers.find((item) => item.id === offerId);
          const post = offer ? posts.find((item) => item.id === offer.postId) : null;
          if (offer && post) setTransactions((items) => [{ id: uid(), postId: post.id, offerId, sellerId: post.authorId ?? "me", buyerId: offer.offererId ?? "demo", status: "accepted", createdAt: new Date().toISOString() }, ...items]);
        }
        return { error: null };
      }

      // 수락은 대화방 자동 생성까지 함께 처리하는 RPC를 통해서만 해요 (판매자는 conversations를
      // 직접 insert할 권한이 없어서, 서버 쪽 함수가 대신 만들어줍니다).
      if (status === "accepted") {
        const { error } = await supabase.rpc("accept_offer", { p_offer_id: offerId });
        if (error) setOffers(before);
        return { error: error?.message ?? null };
      }

      const { error } = await supabase.from("offers").update({ status }).eq("id", offerId);
      if (error) setOffers(before);
      return { error: error?.message ?? null };
    },
    [session, offers, posts],
  );

  const updateTransactionStatus = useCallback(async (transactionId: string, status: TransactionStatus) => {
    const before = transactions;
    setTransactions((items) => items.map((item) => item.id === transactionId ? { ...item, status, completedAt: status === "completed" ? new Date().toISOString() : item.completedAt } : item));
    if (!isSupabaseConfigured || !session) return { error: null };
    const { error } = await supabase.rpc("update_transaction_status", { p_transaction_id: transactionId, p_status: status });
    if (error) setTransactions(before);
    return { error: error?.message ?? null };
  }, [session, transactions]);

  const addReport = useCallback(
    async (input: NewReportInput) => {
      const reporterName = profile?.nickname || profile?.name || "회원";

      if (!isSupabaseConfigured || !session) {
        setReports((items) => [{ id: uid(), ...input, reporter: reporterName, created: "방금 전", status: "pending" }, ...items]);
        return { error: null };
      }

      const { data, error } = await supabase
        .from("reports")
        .insert({ post_id: input.postId, reporter_id: session.user.id, reporter_name: reporterName, reported_user: input.reportedUser, reported_user_id: input.reportedUserId ?? null, reason: input.reason, detail: input.detail })
        .select("*")
        .single();

      if (error || !data) return { error: error?.message ?? "신고를 접수하지 못했어요." };
      setReports((items) => [mapReportRow(data as ReportRow), ...items]);
      return { error: null };
    },
    [profile, session],
  );

  const updateReportStatus = useCallback(
    async (reportId: string, status: ReportStatus) => {
      setReports((items) => items.map((report) => (report.id === reportId ? { ...report, status } : report)));
      if (!isSupabaseConfigured || !session) return { error: null };
      const { error } = await supabase.from("reports").update({ status }).eq("id", reportId);
      return { error: error?.message ?? null };
    },
    [session],
  );

  const markNoticeRead = useCallback(
    (noticeId: string) => {
      setNotices((items) => items.map((notice) => (notice.id === noticeId ? { ...notice, read: true } : notice)));
      if (!isSupabaseConfigured || !session) return;
      supabase
        .from("notices")
        .update({ read: true })
        .eq("id", noticeId)
        .then(({ error }) => {
          if (error) console.log("[notices] 읽음 처리 실패", error.message);
        });
    },
    [session],
  );

  const unreadNoticeCount = useMemo(() => notices.filter((notice) => !notice.read).length, [notices]);
  const blockedIds = useMemo(() => new Set(blockedMembers.map((member) => member.id)), [blockedMembers]);
  const visiblePosts = useMemo(() => posts.filter((post) => !post.authorId || !blockedIds.has(post.authorId)), [posts, blockedIds]);
  const visibleConversations = useMemo(() => conversations.filter((conversation) => !blockedIds.has(conversation.counterpartyId)), [conversations, blockedIds]);

  const blockMember = useCallback(async (member: MemberProfile) => {
    if (blockedMembers.some((item) => item.id === member.id)) return { error: null };
    setBlockedMembers((items) => [member, ...items]);
    if (!isSupabaseConfigured || !session) return { error: null };
    const { error } = await supabase.from("blocked_users").insert({ blocker_id: session.user.id, blocked_id: member.id });
    if (error) setBlockedMembers((items) => items.filter((item) => item.id !== member.id));
    return { error: error?.message ?? null };
  }, [blockedMembers, session]);

  const unblockMember = useCallback(async (userId: string) => {
    const before = blockedMembers;
    setBlockedMembers((items) => items.filter((item) => item.id !== userId));
    if (!isSupabaseConfigured || !session) return { error: null };
    const { error } = await supabase.from("blocked_users").delete().eq("blocker_id", session.user.id).eq("blocked_id", userId);
    if (error) setBlockedMembers(before);
    return { error: error?.message ?? null };
  }, [blockedMembers, session]);

  const value = useMemo(
    () => ({
      nickname: profile?.nickname || profile?.name || "회원",
      region: selectedRegions[0] || "대전 유성구 봉명동",
      selectedRegions,
      setSelectedRegions,
      posts: visiblePosts,
      addPost,
      savedPostIds,
      toggleSaved,
      conversations: visibleConversations,
      startOrGetConversation,
      unreadConversationIds,
      activeConversationId,
      setActiveConversationId,
      offers,
      addOffer,
      updateOfferStatus,
      transactions,
      updateTransactionStatus,
      reports,
      addReport,
      updateReportStatus,
      blockedMembers,
      blockMember,
      unblockMember,
      notices,
      markNoticeRead,
      unreadNoticeCount,
    }),
    [
      profile,
      selectedRegions,
      visiblePosts,
      addPost,
      savedPostIds,
      toggleSaved,
      visibleConversations,
      startOrGetConversation,
      unreadConversationIds,
      activeConversationId,
      setActiveConversationId,
      offers,
      addOffer,
      updateOfferStatus,
      transactions,
      updateTransactionStatus,
      reports,
      addReport,
      updateReportStatus,
      blockedMembers,
      blockMember,
      unblockMember,
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
