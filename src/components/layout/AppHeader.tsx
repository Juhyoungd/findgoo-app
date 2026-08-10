import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useAppData } from "@/src/state/AppDataContext";
import { useAuth } from "@/src/state/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";

// [상단 헤더] 웹 SiteHeader의 RN 버전: 브랜드 로고 + BETA 배지 + 마이페이지 진입 버튼
export function AppHeader() {
  const { palette } = useTheme();
  const { nickname, unreadNoticeCount } = useAppData();
  const { isAdmin } = useAuth();
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
      <View style={styles.headerActions}>
        {isAdmin && (
          <MotionPressable onPress={() => router.push("/admin")} style={[styles.adminButton, { backgroundColor: `${palette.orange}14`, borderColor: `${palette.orange}55` }]} accessibilityLabel="관리자 센터 열기">
            <Text style={{ color: palette.orange, fontSize: 12, fontWeight: "900" }}>A</Text>
          </MotionPressable>
        )}
        <MotionPressable onPress={() => router.push("/my/notifications")} style={[styles.notification, { backgroundColor: palette.white, borderColor: palette.line }]} accessibilityLabel={`전체 알림 열기, 안 읽은 알림 ${unreadNoticeCount}개`}>
          <Text style={{ fontSize: 13 }}>♧</Text>
          {unreadNoticeCount > 0 && <View style={[styles.badge, { backgroundColor: palette.orange }]}><Text style={styles.badgeText}>{unreadNoticeCount}</Text></View>}
        </MotionPressable>
        <MotionPressable onPress={() => router.push("/my")} style={[styles.profile, { backgroundColor: palette.blue }]} accessibilityLabel="마이페이지 열기">
          <Text style={{ color: palette.lime, fontWeight: "700", fontSize: 13 }}>{nickname[0]}</Text>
        </MotionPressable>
      </View>
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  adminButton: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  notification: { width: 32, height: 32, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  profile: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -3, right: -3, minWidth: 15, height: 15, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "white", fontSize: 9, fontWeight: "700" },
});
