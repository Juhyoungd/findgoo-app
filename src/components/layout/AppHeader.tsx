import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";

// [상단 헤더] 웹 SiteHeader의 RN 버전: 브랜드 로고 + BETA 배지 + 마이페이지 진입 버튼
export function AppHeader() {
  const { palette } = useTheme();
  const { nickname, unreadNoticeCount } = useAppData();
  const router = useRouter();

  return (
    <View style={[styles.header, { backgroundColor: palette.white, borderBottomColor: palette.line }]}>
      <View style={styles.brand}>
        <View style={[styles.logo, { backgroundColor: palette.lime }]}>
          <Text style={styles.logoText}>찾</Text>
        </View>
        <Text style={[styles.brandText, { color: palette.ink }]}>찾구</Text>
        <View style={styles.betaPill}>
          <Text style={[styles.betaText, { color: palette.lime }]}>BETA</Text>
        </View>
      </View>
      <Pressable onPress={() => router.push("/my")} style={[styles.profile, { backgroundColor: palette.blue }]} accessibilityLabel="마이페이지 열기">
        <Text style={{ color: palette.lime, fontWeight: "700", fontSize: 13 }}>{nickname[0]}</Text>
        {unreadNoticeCount > 0 && (
          <View style={[styles.badge, { backgroundColor: palette.orange }]}>
            <Text style={styles.badgeText}>{unreadNoticeCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 56, paddingHorizontal: 16, borderBottomWidth: 1 },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  logoText: { color: "white", fontWeight: "700", fontSize: 14 },
  brandText: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  betaPill: { backgroundColor: "#eef3ff", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  betaText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  profile: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -3, right: -3, minWidth: 15, height: 15, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "white", fontSize: 9, fontWeight: "700" },
});
