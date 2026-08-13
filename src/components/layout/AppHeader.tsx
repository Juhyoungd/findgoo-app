import { memo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { appIcons } from "@/src/assets/app-icons";
import { AppIcon } from "@/src/components/common/AppIcon";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useAppData } from "@/src/state/AppDataContext";
import { useAuth } from "@/src/state/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";

// [상단 헤더] 웹 SiteHeader의 RN 버전: 브랜드 로고 + BETA 배지 + 마이페이지 진입 버튼
export const AppHeader = memo(function AppHeader() {
  const { palette } = useTheme();
  const { nickname, unreadNoticeCount } = useAppData();
  const { isAdmin } = useAuth();
  const router = useRouter();

  return (
    <View style={[styles.header, { backgroundColor: palette.white, borderBottomColor: palette.line }]}>
      <MotionPressable onPress={() => router.replace("/")} style={styles.brand} accessibilityLabel="찾구 홈으로 이동">
        <View style={[styles.logo, { backgroundColor: palette.lime }]}>
          <Text style={styles.logoText}>찾</Text>
        </View>
        <Text style={[styles.brandText, { color: palette.ink }]}>찾구</Text>
        <View style={[styles.betaPill, { backgroundColor: palette.blue }]}>
          <Text style={[styles.betaText, { color: palette.lime }]}>BETA</Text>
        </View>
      </MotionPressable>
      <View style={styles.headerActions}>
        {isAdmin && (
          <MotionPressable onPress={() => router.push("/admin")} style={[styles.adminButton, { backgroundColor: palette.white, borderColor: palette.line }]} accessibilityLabel="관리자 센터 열기">
            <Text style={{ color: palette.orange, fontSize: 12, fontWeight: "900" }}>A</Text>
          </MotionPressable>
        )}
        <MotionPressable onPress={() => router.push("/my/notifications")} pressedScale={0.92} style={[styles.notification, { backgroundColor: palette.white, borderColor: palette.line }, Platform.OS === "web" ? { boxShadow: `0 3px 7px ${palette.ink}0d` } : { shadowColor: palette.ink }]} accessibilityLabel={`전체 알림 열기, 안 읽은 알림 ${unreadNoticeCount}개`}>
          <AppIcon name={appIcons.bell} color={palette.ink} size={18} strokeWidth={1.6} />
          {unreadNoticeCount > 0 && <View style={[styles.badge, { backgroundColor: palette.orange }]}><Text style={styles.badgeText}>{unreadNoticeCount}</Text></View>}
        </MotionPressable>
        <MotionPressable onPress={() => router.push("/my")} pressedScale={0.92} style={[styles.profile, { backgroundColor: palette.white, borderColor: palette.line }]} accessibilityLabel="마이페이지 열기">
          <Text style={{ color: palette.ink, fontWeight: "700", fontSize: 12 }}>{nickname[0]}</Text>
        </MotionPressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 56, paddingHorizontal: 16, borderBottomWidth: 1 },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  logoText: { color: "white", fontWeight: "700", fontSize: 14 },
  brandText: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  betaPill: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  betaText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  adminButton: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  notification: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: "center", justifyContent: "center", elevation: 1, ...Platform.select({ web: {}, default: { shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 7 } }) },
  profile: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -3, right: -3, minWidth: 15, height: 15, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "white", fontSize: 9, fontWeight: "700" },
});
