import AsyncStorage from "@react-native-async-storage/async-storage";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

export type UserPreferences = {
  categories: string[];
  keywords: string[];
  pushEnabled: boolean;
};

const STORAGE_KEY = "@findgoo/user-preferences";
export const defaultPreferences: UserPreferences = {
  categories: ["디지털", "심부름", "명품·패션"],
  keywords: ["아이패드", "오픈런"],
  pushEnabled: true,
};

export async function loadPreferences(userId?: string) {
  if (isSupabaseConfigured && userId) {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("categories, keywords, push_enabled")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return { preferences: defaultPreferences, error: error.message };
    if (data) {
      return {
        preferences: {
          categories: data.categories ?? [],
          keywords: data.keywords ?? [],
          pushEnabled: data.push_enabled ?? true,
        } as UserPreferences,
        error: null,
      };
    }
  }

  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return { preferences: stored ? (JSON.parse(stored) as UserPreferences) : defaultPreferences, error: null };
}

export async function savePreferences(userId: string | undefined, preferences: UserPreferences) {
  if (isSupabaseConfigured && userId) {
    const { error } = await supabase.from("user_preferences").upsert({
      user_id: userId,
      categories: preferences.categories,
      keywords: preferences.keywords,
      push_enabled: preferences.pushEnabled,
      updated_at: new Date().toISOString(),
    });
    return { error: error?.message ?? null };
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  return { error: null };
}
