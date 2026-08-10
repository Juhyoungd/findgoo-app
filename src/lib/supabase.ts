import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase 환경변수가 없어요. .env.local에 EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.",
  );
}
console.log("[supabase] client 초기화", { url: supabaseUrl, hasKey: !!supabaseAnonKey });

// [회원 인증] 환경변수가 없는 로컬 베타에서도 UI가 중단되지 않도록 유효한 로컬 주소로 클라이언트만 생성합니다.
// 실제 인증 요청은 AuthContext에서 isSupabaseConfigured를 확인한 뒤 차단합니다.
export const supabase = createClient(supabaseUrl || "http://127.0.0.1:54321", supabaseAnonKey || "findgoo-local-anon-key", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});
