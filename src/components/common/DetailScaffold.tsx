import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BackButton } from "@/src/components/common/BackButton";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { useTheme } from "@/src/theme/ThemeContext";

// [상세 화면] 마이페이지·고객센터 하위 화면의 공통 헤더와 모바일 스크롤 여백입니다.
export function DetailScaffold({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  const { palette } = useTheme();
  const router = useRouter();
  const goBack = () => router.canGoBack() ? router.back() : router.replace("/my");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <AppHeader />
      <View style={[styles.header, { borderBottomColor: palette.line }]}>
        <BackButton onPress={goBack} />
        <View><Text style={[styles.eyebrow, { color: palette.lime }]}>{eyebrow}</Text><Text style={[styles.title, { color: palette.ink }]}>{title}</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, paddingHorizontal: 20 },
  eyebrow: { fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  title: { fontSize: 19, fontWeight: "900", marginTop: 2 },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
});
