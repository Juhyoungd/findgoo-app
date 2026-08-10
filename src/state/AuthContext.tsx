import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { supabase } from "@/src/lib/supabase";

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
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
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

  useEffect(() => {
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log("[auth] signIn 응답", { hasSession: !!data.session, error: error?.message, status: error?.status });
    return { error: error?.message ?? null };
  }

  async function signUp(input: { email: string; password: string; name: string; phone: string }) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { name: input.name, phone: input.phone } },
    });
    console.log("[auth] signUp 응답", { userId: data.user?.id, hasSession: !!data.session, error: error?.message });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function resetPassword(email: string) {
    // 메일의 링크를 눌렀을 때 이 앱의 /reset-password 화면으로 돌아오도록 지정합니다.
    // Supabase 대시보드의 Authentication > URL Configuration > Redirect URLs에
    // 이 주소(패턴)를 허용 목록으로 등록해둬야 실제로 이 주소로 돌아와요.
    const redirectTo = Linking.createURL("reset-password");
    console.log("[auth] resetPassword redirectTo", redirectTo);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { error: error?.message ?? null };
  }

  const value = useMemo(
    () => ({ session, profile, initializing, signIn, signUp, signOut, resetPassword }),
    [session, profile, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있어요.");
  return context;
}
