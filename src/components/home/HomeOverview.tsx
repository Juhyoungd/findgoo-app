import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import type { PostType } from "@/src/types/findgoo";

type HomeOverviewProps = {
  region: string;
  query: string;
  onChangeQuery: (value: string) => void;
  onCreatePost: (type: PostType) => void;
  chatCount: number;
  pendingIncomingCount: number;
  outgoingPendingCount: number;
  savedUrgentCount: number;
  onOpenChat: () => void;
  onOpenTrade: () => void;
  onOpenMy: () => void;
};

// [홈] 검색, 빠른 글쓰기, 활동 요약을 모은 홈 화면 (웹 HomeOverview의 RN 버전)
// 배경 블롭은 화면 전체에 깔리는 <BackgroundBlobs />(SafeAreaView 레벨)가 담당하므로,
// 이 카드는 배경을 투명하게 두어 블롭이 카드 안에 갇히지 않고 화면 크기 그대로 비쳐 보이게 합니다.
export function HomeOverview({ region, query, onChangeQuery, onCreatePost, chatCount, pendingIncomingCount, outgoingPendingCount, savedUrgentCount, onOpenChat, onOpenTrade, onOpenMy }: HomeOverviewProps) {
  const { activeTheme, palette, cycleTheme } = useTheme();

  return (
    <View style={styles.overview}>
      <View style={styles.welcomeRow}>
        <View style={styles.welcomeText}>
          <Text style={[styles.regionLabel, { color: palette.lime }]}>⌖ {region}</Text>
          <Text style={[styles.title, { color: palette.ink }]}>무엇을 찾고 있나요?</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>원하는 물건이나 도움이 필요한 일을 먼저 올려보세요.</Text>
        </View>
        <Pressable
          onPress={cycleTheme}
          style={[styles.paletteSwitch, { backgroundColor: palette.white, borderColor: palette.line }]}
          accessibilityLabel={`현재 ${activeTheme.label} 색상, 다음 색상으로 변경`}
        >
          <Text style={{ fontSize: 16 }}>{activeTheme.icon}</Text>
        </Pressable>
      </View>

      <View style={[styles.searchBar, { backgroundColor: palette.white, borderColor: palette.line }]}>
        <Text style={{ fontSize: 18, color: palette.muted }}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="물건, 심부름, 일손을 검색해요"
          placeholderTextColor={palette.muted}
          style={[styles.searchInput, { color: palette.ink }]}
        />
        {query.length > 0 && (
          <Pressable onPress={() => onChangeQuery("")} hitSlop={8}>
            <Text style={{ color: palette.muted, fontSize: 16 }}>×</Text>
          </Pressable>
        )}
      </View>

      {/* 구매글/급구 올리기 카드: 항상 세로로 배치 */}
      <View style={styles.actions}>
        <Pressable onPress={() => onCreatePost("buy")} style={[styles.actionButton, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <View style={[styles.actionIcon, { backgroundColor: palette.blue }]}><Text style={{ fontSize: 19, color: palette.lime }}>＋</Text></View>
          <View style={styles.actionTextGroup}>
            <Text style={[styles.actionTitle, { color: palette.ink }]}>구매글 올리기</Text>
            <Text style={[styles.actionHint, { color: palette.muted }]}>찾는 물건을 알려주세요</Text>
          </View>
          <Text style={[styles.chevron, { color: palette.muted }]}>›</Text>
        </Pressable>
        <Pressable onPress={() => onCreatePost("urgent")} style={[styles.actionButton, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <View style={[styles.actionIcon, { backgroundColor: `${palette.orange}33` }]}><Text style={{ fontSize: 19, color: palette.orange }}>ϟ</Text></View>
          <View style={styles.actionTextGroup}>
            <Text style={[styles.actionTitle, { color: palette.ink }]}>급구 올리기</Text>
            <Text style={[styles.actionHint, { color: palette.muted }]}>사람과 심부름을 구해요</Text>
          </View>
          <Text style={[styles.chevron, { color: palette.muted }]}>›</Text>
        </Pressable>
      </View>

      <View style={[styles.statusRow, { backgroundColor: palette.white, borderColor: palette.line }]}>
        <Pressable onPress={onOpenChat} style={[styles.statusItem, { borderRightColor: palette.line }]}>
          <Text style={[styles.statusValue, { color: palette.ink }]}>{chatCount}</Text>
          <Text style={[styles.statusLabel, { color: palette.muted }]}>최근 채팅</Text>
        </Pressable>
        <Pressable onPress={onOpenTrade} style={[styles.statusItem, { borderRightColor: palette.line }]}>
          <Text style={[styles.statusValue, { color: palette.ink }]}>{pendingIncomingCount}</Text>
          <Text style={[styles.statusLabel, { color: palette.muted }]}>받은 제안</Text>
        </Pressable>
        <Pressable onPress={onOpenTrade} style={[styles.statusItem, { borderRightColor: palette.line }]}>
          <Text style={[styles.statusValue, { color: palette.ink }]}>{outgoingPendingCount}</Text>
          <Text style={[styles.statusLabel, { color: palette.muted }]}>보낸 제안</Text>
        </Pressable>
        <Pressable onPress={onOpenMy} style={styles.statusItem}>
          <Text style={[styles.statusValue, { color: palette.ink }]}>{savedUrgentCount}</Text>
          <Text style={[styles.statusLabel, { color: palette.muted }]}>찜한 급구</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overview: { padding: 24, paddingTop: 24, paddingBottom: 28, gap: 0 },
  welcomeRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 16 },
  welcomeText: { flex: 1 },
  regionLabel: { fontSize: 12, fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "800", marginTop: 8, marginBottom: 6, letterSpacing: -0.8 },
  subtitle: { fontSize: 13, lineHeight: 19 },
  paletteSwitch: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 19 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, height: 52, borderWidth: 1, borderRadius: 13, paddingHorizontal: 16, marginTop: 20 },
  searchInput: { flex: 1, fontSize: 14 },
  actions: { gap: 10, marginTop: 16 },
  actionButton: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, padding: 15, minHeight: 78 },
  actionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionTextGroup: { flex: 1, gap: 4 },
  actionTitle: { fontSize: 15, fontWeight: "700" },
  actionHint: { fontSize: 11 },
  chevron: { fontSize: 17 },
  statusRow: { flexDirection: "row", borderWidth: 1, borderRadius: 14, marginTop: 16, paddingVertical: 8 },
  statusItem: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 6, borderRightWidth: 1 },
  statusValue: { fontSize: 17, fontWeight: "800" },
  statusLabel: { fontSize: 9 },
});
