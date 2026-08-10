import { Redirect, Tabs } from "expo-router";
import { AppTabBar } from "@/src/components/layout/AppTabBar";
import { isSupabaseConfigured } from "@/src/lib/supabase";
import { useAuth } from "@/src/state/AuthContext";

// [하단 메뉴] 홈/급구/등록/구매글/채팅 다섯 탭 구성. 마이페이지는 탭바에서는 숨기고
// 헤더 프로필 아바타·홈 바로가기로만 진입하도록 href: null로 라우트만 남겨둡니다.
// Supabase가 연결된 운영 환경에서는 로그인 세션을 확인하고,
// 환경변수가 없는 로컬 베타에서는 기존처럼 전체 화면을 바로 둘러볼 수 있게 합니다.
export default function TabLayout() {
  const { session, initializing } = useAuth();
  if (initializing) return null;
  if (isSupabaseConfigured && !session) return <Redirect href="/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: "홈" }} />
      <Tabs.Screen name="market" options={{ title: "급구" }} />
      <Tabs.Screen name="create" options={{ title: "등록" }} />
      <Tabs.Screen name="buy" options={{ title: "구매글" }} />
      <Tabs.Screen name="chat" options={{ title: "채팅" }} />
      <Tabs.Screen name="my" options={{ title: "마이", href: null }} />
    </Tabs>
  );
}
