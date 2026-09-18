import AsyncStorage from "@react-native-async-storage/async-storage";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

export type SupportInquiry = { id: string; category: string; title: string; body: string; status: "pending" | "answered"; answer?: string | null; createdAt: string };
const STORAGE_KEY = "@findgoo/support-inquiries";

export async function createSupportInquiry(userId: string | undefined, input: { category: string; title: string; body: string }) {
  if (isSupabaseConfigured && userId) {
    const { data, error } = await supabase.from("support_inquiries").insert({ user_id: userId, ...input }).select("*").single();
    return { inquiry: data ? mapRow(data) : null, error: error?.message ?? null };
  }
  const current = await loadLocal();
  const inquiry: SupportInquiry = { id: `inquiry-${Date.now()}`, ...input, status: "pending", createdAt: new Date().toISOString() };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([inquiry, ...current]));
  return { inquiry, error: null };
}

export async function listSupportInquiries(userId?: string) {
  if (isSupabaseConfigured && userId) {
    const { data, error } = await supabase.from("support_inquiries").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    return { inquiries: data ? data.map(mapRow) : [], error: error?.message ?? null };
  }
  return { inquiries: await loadLocal(), error: null };
}

// [관리자] 본인 것만 필터링하지 않고 전체를 가져와요 — RLS가 관리자 role일 때만 전체 행을 허용해줘요.
export async function listAllSupportInquiries() {
  if (!isSupabaseConfigured) return { inquiries: [], error: null };
  const { data, error } = await supabase.from("support_inquiries").select("*").order("created_at", { ascending: false });
  return { inquiries: data ? data.map(mapRow) : [], error: error?.message ?? null };
}

export async function answerSupportInquiry(inquiryId: string, answer: string) {
  if (!isSupabaseConfigured) return { error: "Supabase 연결이 필요해요." };
  const { error } = await supabase
    .from("support_inquiries")
    .update({ status: "answered", answer, answered_at: new Date().toISOString() })
    .eq("id", inquiryId);
  return { error: error?.message ?? null };
}

function mapRow(row: Record<string, unknown>): SupportInquiry {
  return { id: String(row.id), category: String(row.category), title: String(row.title), body: String(row.body), status: row.status as SupportInquiry["status"], answer: row.answer as string | null, createdAt: String(row.created_at) };
}

async function loadLocal(): Promise<SupportInquiry[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}
