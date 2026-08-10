import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

export type Profile = {
  id: string;
  name: string;
  phone: string | null;
  nickname: string | null;
  region: string | null;
};

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; isAdmin: boolean }>;
  signUp: (input: { email: string; password: string; name: string; phone: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// [회원 인증] Supabase Auth 세션 + profiles 테이블을 함께 들고 있는 전역 인증 상태
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
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
    if (!session) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("id, name, phone, nickname, region")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [session]);

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured) return { error: "Supabase 환경변수를 먼저 설정해주세요.", isAdmin: false };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null, isAdmin: data.session?.user.app_metadata?.role === "admin" };
  }

  async function signUp(input: { email: string; password: string; name: string; phone: string }) {
    if (!isSupabaseConfigured) return { error: "Supabase 환경변수를 먼저 설정해주세요." };
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { name: input.name, phone: input.phone } },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }

  async function resetPassword(email: string) {
    if (!isSupabaseConfigured) return { error: "Supabase 환경변수를 먼저 설정해주세요." };
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message ?? null };
  }

  const value = useMemo(
    () => ({ session, profile, isAdmin, initializing, signIn, signUp, signOut, resetPassword }),
    [session, profile, isAdmin, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있어요.");
  return context;
}
