import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { MotionPressable as Pressable } from "@/src/components/common/MotionPressable";
import { useAuth } from "@/src/state/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";

type AdminShellProps = {
  title: string;
  eyebrow?: string;
  badge?: string;
  children: ReactNode;
};

// [관리자] 모든 관리자 화면의 권한 차단·공통 헤더·모바일 스크롤 레이아웃
export function AdminShell({ title, eyebrow = "ADMIN CENTER", badge, children }: AdminShellProps) {
  const { palette } = useTheme();
  const { isAdmin } = useAuth();
  const router = useRouter();

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.denied, { backgroundColor: palette.paper }]}>
        <View style={[styles.deniedIcon, { backgroundColor: `${palette.orange}18` }]}><Text style={{ color: palette.orange, fontSize: 24, fontWeight: "900" }}>!</Text></View>
        <Text style={[styles.deniedTitle, { color: palette.ink }]}>관리자 권한이 필요해요</Text>
        <Text style={[styles.deniedBody, { color: palette.muted }]}>관리자 계정으로 다시 로그인해주세요.</Text>
        <Pressable onPress={() => router.replace("/")} style={[styles.homeButton, { backgroundColor: palette.lime }]}><Text style={{ color: palette.white, fontWeight: "800" }}>홈으로</Text></Pressable>
      </SafeAreaView>
    );
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <AppHeader />
      <View style={[styles.header, { borderBottomColor: palette.line }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="이전 화면으로 돌아가기" onPress={goBack} style={({ pressed }) => [styles.back, { backgroundColor: palette.white, borderColor: palette.line }, pressed && styles.pressed]}><Text style={{ color: palette.ink, fontSize: 27 }}>‹</Text></Pressable>
        <View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: palette.orange }]}>{eyebrow}</Text><Text style={[styles.title, { color: palette.ink }]}>{title}</Text></View>
        {badge && <View style={[styles.badge, { backgroundColor: `${palette.orange}18` }]}><Text style={{ color: palette.orange, fontSize: 9, fontWeight: "900" }}>{badge}</Text></View>}
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, borderBottomWidth: 1 },
  back: { width: 38, height: 38, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  eyebrow: { fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  title: { fontSize: 19, fontWeight: "900", marginTop: 2 },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  denied: { flex: 1, alignItems: "center", justifyContent: "center", gap: 9, padding: 28 },
  deniedIcon: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  deniedTitle: { fontSize: 18, fontWeight: "900" },
  deniedBody: { fontSize: 11 },
  homeButton: { width: "100%", alignItems: "center", borderRadius: 14, paddingVertical: 14, marginTop: 10 },
});
