import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { demoMyProfile } from "@/src/constants/member-profiles";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import type { MannerStats } from "@/src/types/findgoo";

export type Profile = {
  id: string;
  name: string;
  phone: string | null;
  nickname: string;
  region: string | null;
  avatarUrl: string | null;
  createdAt: string;
  mannerStats: MannerStats;
};

type ProfileRow = {
  id: string;
  name: string;
  phone: string | null;
  nickname: string | null;
  region: string | null;
  avatar_url?: string | null;
  created_at?: string;
  completed_trades?: number;
  good_manner_reviews?: number;
  urgent_successes?: number;
  manner_reports?: number;
};

type ProfileUpdateInput = { nickname: string; avatarUrl: string | null; password?: string };
type AuthResult = { error: string | null };
type SocialProvider = "google" | "naver";

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; isAdmin: boolean }>;
  signUp: (input: { email: string; password: string; name: string; nickname: string; phone: string }) => Promise<{ error: string | null }>;
  requestPhoneVerification: (phone: string) => Promise<AuthResult>;
  verifyPhoneCode: (phone: string, code: string) => Promise<AuthResult>;
  signInWithSocial: (provider: SocialProvider) => Promise<AuthResult>;
  updateProfile: (input: ProfileUpdateInput) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
WebBrowser.maybeCompleteAuthSession();

function toKoreanE164(phone: string) {
  const normalized = phone.replace(/[^0-9]/g, "");
  return normalized.startsWith("0") ? `+82${normalized.slice(1)}` : `+82${normalized}`;
}

function normalizeProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    nickname: row.nickname || row.name || "회원",
    region: row.region,
    avatarUrl: row.avatar_url ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
    mannerStats: {
      completedTrades: row.completed_trades ?? 0,
      goodMannerReviews: row.good_manner_reviews ?? 0,
      successfulUrgentMissions: row.urgent_successes ?? 0,
      mannerReports: row.manner_reports ?? 0,
    },
  };
}

const localDemoProfile: Profile = {
  id: demoMyProfile.id,
  name: demoMyProfile.name,
  phone: demoMyProfile.phone,
  nickname: demoMyProfile.nickname,
  region: demoMyProfile.recentRegion,
  avatarUrl: demoMyProfile.avatarUrl,
  createdAt: demoMyProfile.joinedAt,
  mannerStats: demoMyProfile.mannerStats,
};

// [회원 인증] Supabase Auth 세션 + profiles 테이블을 함께 들고 있는 전역 인증 상태
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(isSupabaseConfigured ? null : localDemoProfile);
  const [initializing, setInitializing] = useState(true);
  // [관리자 계정] 운영 환경에서는 Supabase app_metadata.role만 신뢰합니다.
  // Supabase가 없는 로컬 베타에서는 관리자 화면을 검토할 수 있도록 권한을 엽니다.
  const isAdmin = !isSupabaseConfigured || session?.user.app_metadata?.role === "admin";

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setInitializing(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!session) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setProfile(data ? normalizeProfile(data as ProfileRow) : null));
  }, [session]);

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured) return { error: "Supabase 환경변수를 먼저 설정해주세요.", isAdmin: false };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null, isAdmin: data.session?.user.app_metadata?.role === "admin" };
  }

  async function signUp(input: { email: string; password: string; name: string; nickname: string; phone: string }) {
    if (!isSupabaseConfigured) return { error: "Supabase 환경변수를 먼저 설정해주세요." };
    const { data: sessionData } = await supabase.auth.getSession();
    const verifiedSession = sessionData.session;
    if (!verifiedSession?.user.phone || verifiedSession.user.phone !== toKoreanE164(input.phone)) {
      return { error: "휴대폰 인증을 다시 완료해주세요." };
    }

    const metadata = { name: input.name, nickname: input.nickname, phone: input.phone, phone_verified: true };
    const { error: userError } = await supabase.auth.updateUser({ email: input.email, password: input.password, data: metadata });
    if (userError) return { error: userError.message };

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: verifiedSession.user.id,
      name: input.name,
      nickname: input.nickname,
      phone: input.phone,
    });
    return { error: profileError?.message ?? null };
  }

  async function requestPhoneVerification(phone: string) {
    if (!isSupabaseConfigured) return { error: "실제 휴대폰 인증을 사용하려면 Supabase 연결이 필요해요." };
    const { error } = await supabase.auth.signInWithOtp({
      phone: toKoreanE164(phone),
      options: { shouldCreateUser: true, data: { signup_pending: true } },
    });
    return { error: error?.message ?? null };
  }

  async function verifyPhoneCode(phone: string, code: string) {
    if (!isSupabaseConfigured) return { error: "실제 휴대폰 인증을 사용하려면 Supabase 연결이 필요해요." };
    const { error } = await supabase.auth.verifyOtp({ phone: toKoreanE164(phone), token: code, type: "sms" });
    return { error: error?.message ?? null };
  }

  async function signInWithSocial(provider: SocialProvider) {
    if (!isSupabaseConfigured) return { error: "소셜 로그인을 사용하려면 Supabase 연결이 필요해요." };
    const redirectTo = Linking.createURL("auth/callback");

    if (provider === "naver") {
      const endpoint = process.env.EXPO_PUBLIC_NAVER_AUTH_URL;
      if (!endpoint) return { error: "네이버 로그인 서버 주소가 아직 설정되지 않았어요." };
      const separator = endpoint.includes("?") ? "&" : "?";
      const result = await WebBrowser.openAuthSessionAsync(`${endpoint}${separator}redirect_to=${encodeURIComponent(redirectTo)}`, redirectTo);
      if (result.type !== "success") return { error: result.type === "cancel" ? null : "네이버 로그인을 완료하지 못했어요." };
      const callback = new URL(result.url);
      const tokenHash = callback.searchParams.get("token_hash");
      if (!tokenHash) return { error: callback.searchParams.get("error_description") ?? "네이버 로그인 정보를 확인하지 못했어요." };
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
      return { error: error?.message ?? null };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: true } });
    if (error || !data.url) return { error: error?.message ?? "구글 로그인을 시작하지 못했어요." };
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success") return { error: result.type === "cancel" ? null : "구글 로그인을 완료하지 못했어요." };
    const code = new URL(result.url).searchParams.get("code");
    if (!code) return { error: "구글 로그인 승인 코드를 확인하지 못했어요." };
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    return { error: exchangeError?.message ?? null };
  }

  async function updateProfile(input: ProfileUpdateInput) {
    if (!profile) return { error: "프로필 정보를 불러오지 못했어요." };
    const nextProfile = { ...profile, nickname: input.nickname, avatarUrl: input.avatarUrl };
    if (!isSupabaseConfigured || !session) {
      setProfile(nextProfile);
      return { error: null };
    }

    if (input.password) {
      const { error } = await supabase.auth.updateUser({ password: input.password });
      if (error) return { error: error.message };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ nickname: input.nickname, avatar_url: input.avatarUrl })
      .eq("id", session.user.id);
    if (error) return { error: error.message };
    setProfile(nextProfile);
    return { error: null };
  }

  async function signOut() {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }

  async function resetPassword(email: string) {
    if (!isSupabaseConfigured) return { error: "Supabase 환경변수를 먼저 설정해주세요." };
    // 메일의 링크를 눌렀을 때 이 앱의 /reset-password 화면으로 돌아오도록 지정합니다.
    // Supabase 대시보드의 Authentication > URL Configuration > Redirect URLs에
    // 이 주소(패턴)를 허용 목록으로 등록해둬야 실제로 이 주소로 돌아와요.
    const redirectTo = Linking.createURL("reset-password");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { error: error?.message ?? null };
  }

  async function deleteAccount() {
    if (!isSupabaseConfigured || !session) return { error: "로그인된 계정을 확인하지 못했어요." };
    const { error } = await supabase.functions.invoke("delete-account");
    if (error) return { error: error.message };
    await supabase.auth.signOut();
    setProfile(null);
    return { error: null };
  }

  const value = useMemo(
    () => ({ session, profile, isAdmin, initializing, signIn, signUp, requestPhoneVerification, verifyPhoneCode, signInWithSocial, updateProfile, signOut, resetPassword, deleteAccount }),
    [session, profile, isAdmin, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있어요.");
  return context;
}
