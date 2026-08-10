import { StyleSheet, Text, View } from "react-native";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";
import type { Post } from "@/src/types/findgoo";

type HomeOverviewProps = {
  region: string;
  featuredUrgent?: Post;
  featuredBuy?: Post;
  activeTradeCount: number;
  pendingIncomingCount: number;
  outgoingPendingCount: number;
  savedCount: number;
  onOpenRegion: () => void;
  onOpenUrgent: () => void;
  onOpenBuy: () => void;
  onOpenSafety: () => void;
  onOpenActiveTrades: () => void;
  onOpenIncomingOffers: () => void;
  onOpenOutgoingOffers: () => void;
  onOpenSaved: () => void;
};

// [홈] 등록 기능은 하단 중앙 버튼에 집중하고, 홈은 동네 현황·추천 글·내 거래 활동을 빠르게 확인합니다.
export function HomeOverview({
  region,
  featuredUrgent,
  featuredBuy,
  activeTradeCount,
  pendingIncomingCount,
  outgoingPendingCount,
  savedCount,
  onOpenRegion,
  onOpenUrgent,
  onOpenBuy,
  onOpenSafety,
  onOpenActiveTrades,
  onOpenIncomingOffers,
  onOpenOutgoingOffers,
  onOpenSaved,
}: HomeOverviewProps) {
  const { palette } = useTheme();

  return (
    <View style={styles.overview}>
      <MotionPressable onPress={onOpenRegion} style={[styles.regionButton, { backgroundColor: palette.white, borderColor: palette.line }]} accessibilityLabel="활동 지역 설정 열기">
        <View style={[styles.pin, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontWeight: "900" }}>⌖</Text></View>
        <View style={{ flex: 1 }}><Text style={[styles.regionEyebrow, { color: palette.muted }]}>내 활동 지역</Text><Text style={[styles.regionName, { color: palette.ink }]} numberOfLines={1}>{region}</Text></View>
        <Text style={{ color: palette.muted, fontSize: 18 }}>›</Text>
      </MotionPressable>

      <View style={[styles.hero, { backgroundColor: palette.ink }]}>
        <View style={[styles.heroGlow, { backgroundColor: palette.blue }]} />
        <View style={[styles.betaChip, { backgroundColor: `${palette.white}1a` }]}><Text style={styles.betaText}>대전·세종 BETA</Text></View>
        <Text style={styles.heroTitle}>필요한 것을 먼저 말하면,{"\n"}동네가 답해줘요.</Text>
        <Text style={styles.heroBody}>구매 희망과 급한 도움을 둘러보고 제안으로 거래를 시작하세요.</Text>
      </View>

      <View style={styles.sectionHeading}>
        <View><Text style={[styles.sectionTitle, { color: palette.ink }]}>지금 우리 동네</Text><Text style={[styles.sectionCaption, { color: palette.muted }]}>마감과 반응이 가까운 글을 골랐어요.</Text></View>
      </View>

      <View style={styles.spotlights}>
        <SpotlightCard label="마감 임박 급구" icon="ϟ" post={featuredUrgent} accent={palette.orange} background={`${palette.orange}10`} onPress={onOpenUrgent} />
        <SpotlightCard label="새 구매 요청" icon="⌕" post={featuredBuy} accent={palette.lime} background={palette.white} onPress={onOpenBuy} />
      </View>

      <View style={styles.sectionHeading}>
        <View><Text style={[styles.sectionTitle, { color: palette.ink }]}>내 거래 활동</Text><Text style={[styles.sectionCaption, { color: palette.muted }]}>확인이 필요한 순서대로 모았어요.</Text></View>
      </View>

      <View style={styles.activityGrid}>
        <ActivityCard label="진행 중 거래" value={activeTradeCount} icon="✓" onPress={onOpenActiveTrades} />
        <ActivityCard label="받은 제안" value={pendingIncomingCount} icon="↓" highlight onPress={onOpenIncomingOffers} />
        <ActivityCard label="보낸 제안" value={outgoingPendingCount} icon="↑" onPress={onOpenOutgoingOffers} />
        <ActivityCard label="찜한 글" value={savedCount} icon="♥" onPress={onOpenSaved} />
      </View>

      <MotionPressable onPress={onOpenSafety} style={[styles.guide, { backgroundColor: palette.blue, borderColor: `${palette.lime}22` }]} accessibilityLabel="안전 거래 가이드 열기">
        <View style={[styles.guideIcon, { backgroundColor: palette.white }]}><Text style={{ color: palette.lime, fontWeight: "900" }}>✓</Text></View>
        <View style={{ flex: 1 }}><Text style={[styles.guideTitle, { color: palette.ink }]}>처음 거래하시나요?</Text><Text style={[styles.guideBody, { color: palette.muted }]}>선입금·대리구매 전 안전 체크를 확인하세요.</Text></View>
        <Text style={{ color: palette.lime, fontSize: 18 }}>›</Text>
      </MotionPressable>
    </View>
  );

  function ActivityCard({ label, value, icon, highlight = false, onPress }: { label: string; value: number; icon: string; highlight?: boolean; onPress: () => void }) {
    return (
      <MotionPressable onPress={onPress} style={[styles.activityCard, { backgroundColor: highlight ? `${palette.orange}10` : palette.white, borderColor: highlight ? `${palette.orange}55` : palette.line }]}>
        <View style={[styles.activityIcon, { backgroundColor: highlight ? `${palette.orange}18` : palette.paper }]}><Text style={{ color: highlight ? palette.orange : palette.lime, fontWeight: "900" }}>{icon}</Text></View>
        <Text style={[styles.activityValue, { color: highlight ? palette.orange : palette.ink }]}>{value}</Text>
        <Text style={[styles.activityLabel, { color: palette.muted }]}>{label}</Text>
        <Text style={[styles.activityArrow, { color: palette.muted }]}>›</Text>
      </MotionPressable>
    );
  }

  function SpotlightCard({ label, icon, post, accent, background, onPress }: { label: string; icon: string; post?: Post; accent: string; background: string; onPress: () => void }) {
    return (
      <MotionPressable onPress={onPress} style={[styles.spotlight, { backgroundColor: background, borderColor: palette.line }]}>
        <View style={styles.spotlightLabel}><Text style={{ color: accent, fontWeight: "900" }}>{icon}</Text><Text style={[styles.spotlightEyebrow, { color: accent }]}>{label}</Text></View>
        <Text style={[styles.spotlightTitle, { color: palette.ink }]} numberOfLines={2}>{post?.title ?? "새 글을 둘러보세요"}</Text>
        <Text style={[styles.spotlightMeta, { color: palette.muted }]} numberOfLines={1}>{post ? `${post.region} · ${won(post.price)}` : "대전·세종 전체"}</Text>
        <View style={[styles.openPill, { backgroundColor: accent }]}><Text style={styles.openText}>둘러보기</Text></View>
      </MotionPressable>
    );
  }
}

const styles = StyleSheet.create({
  overview: { padding: 20, paddingTop: 16, paddingBottom: 28, gap: 16 },
  regionButton: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 15, padding: 11 },
  pin: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  regionEyebrow: { fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  regionName: { fontSize: 12, fontWeight: "900", marginTop: 2 },
  hero: { position: "relative", overflow: "hidden", borderRadius: 22, padding: 21, minHeight: 176 },
  heroGlow: { position: "absolute", right: -42, top: -32, width: 150, height: 150, borderRadius: 75, opacity: 0.42 },
  betaChip: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  betaText: { color: "white", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  heroTitle: { color: "white", fontSize: 23, lineHeight: 31, fontWeight: "900", letterSpacing: -0.7, marginTop: 16 },
  heroBody: { color: "rgba(255,255,255,0.64)", fontSize: 10, lineHeight: 16, marginTop: 8, maxWidth: 280 },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "900" },
  sectionCaption: { fontSize: 10, marginTop: 3 },
  spotlights: { flexDirection: "row", gap: 9 },
  spotlight: { flex: 1, minHeight: 154, borderWidth: 1, borderRadius: 18, padding: 14 },
  spotlightLabel: { flexDirection: "row", alignItems: "center", gap: 5 },
  spotlightEyebrow: { fontSize: 9, fontWeight: "900" },
  spotlightTitle: { fontSize: 13, lineHeight: 19, fontWeight: "800", marginTop: 11 },
  spotlightMeta: { fontSize: 9, marginTop: 6 },
  openPill: { alignSelf: "flex-start", marginTop: "auto", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  openText: { color: "white", fontSize: 8, fontWeight: "900" },
  activityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  activityCard: { position: "relative", width: "48.7%", minHeight: 92, borderWidth: 1, borderRadius: 17, padding: 13 },
  activityIcon: { width: 29, height: 29, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  activityValue: { position: "absolute", right: 14, top: 12, fontSize: 20, fontWeight: "900" },
  activityLabel: { fontSize: 10, fontWeight: "700", marginTop: 10 },
  activityArrow: { position: "absolute", right: 11, bottom: 9, fontSize: 15 },
  guide: { flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderRadius: 17, padding: 14 },
  guideIcon: { width: 36, height: 36, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  guideTitle: { fontSize: 12, fontWeight: "900" },
  guideBody: { fontSize: 9, marginTop: 3 },
});
