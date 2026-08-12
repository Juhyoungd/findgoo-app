import { StyleSheet, Text, View } from "react-native";
import { appIcons, type AppIconName } from "@/src/assets/app-icons";
import { AppIcon } from "@/src/components/common/AppIcon";
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
  openUrgentCount: number;
  openBuyCount: number;
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
  openUrgentCount,
  openBuyCount,
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

      <View style={styles.block}>
        <View style={styles.sectionHeading}>
          <View><Text style={[styles.sectionTitle, { color: palette.ink }]}>지금 우리 동네</Text><Text style={[styles.sectionCaption, { color: palette.muted }]}>마감과 반응이 가까운 글을 골랐어요.</Text></View>
        </View>

        <View style={styles.spotlights}>
          <SpotlightCard label="마감 임박 급구" icon={appIcons.urgent} post={featuredUrgent} accent={palette.orange} background={`${palette.orange}10`} onPress={onOpenUrgent} />
          <SpotlightCard label="새 구매 요청" icon={appIcons.buy} post={featuredBuy} accent={palette.lime} background={palette.white} onPress={onOpenBuy} />
        </View>

        <View style={[styles.neighborhoodPulse, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <View style={styles.pulseIntro}>
            <View style={styles.pulseTitleRow}><View style={[styles.liveDot, { backgroundColor: palette.lime }]} /><Text style={[styles.pulseTitle, { color: palette.ink }]}>우리 동네 반응</Text></View>
            <Text style={[styles.pulseRegion, { color: palette.muted }]} numberOfLines={1}>{region} 기준</Text>
          </View>
          <View style={[styles.pulseDivider, { backgroundColor: palette.line }]} />
          <PulseStat label="급구" value={openUrgentCount} onPress={onOpenUrgent} />
          <PulseStat label="구매 요청" value={openBuyCount} onPress={onOpenBuy} />
          <PulseStat label="새 제안" value={pendingIncomingCount} onPress={onOpenIncomingOffers} highlight />
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.sectionHeading}>
          <View><Text style={[styles.sectionTitle, { color: palette.ink }]}>내 거래 활동</Text><Text style={[styles.sectionCaption, { color: palette.muted }]}>확인이 필요한 순서대로 모았어요.</Text></View>
        </View>

        <View style={styles.activityGrid}>
          <ActivityCard label="진행 중 거래" value={activeTradeCount} icon="✓" onPress={onOpenActiveTrades} />
          <ActivityCard label="받은 제안" value={pendingIncomingCount} icon="↓" highlight onPress={onOpenIncomingOffers} />
          <ActivityCard label="보낸 제안" value={outgoingPendingCount} icon="↑" onPress={onOpenOutgoingOffers} />
          <ActivityCard label="찜한 글" value={savedCount} icon="♥" onPress={onOpenSaved} />
        </View>
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

  function PulseStat({ label, value, onPress, highlight = false }: { label: string; value: number; onPress: () => void; highlight?: boolean }) {
    return (
      <MotionPressable onPress={onPress} style={styles.pulseStat} accessibilityLabel={`${label} ${value}개 보기`}>
        <Text style={[styles.pulseValue, { color: highlight ? palette.orange : palette.ink }]}>{value}</Text>
        <Text style={[styles.pulseLabel, { color: palette.muted }]}>{label}</Text>
      </MotionPressable>
    );
  }

  function SpotlightCard({ label, icon, post, accent, background, onPress }: { label: string; icon: AppIconName; post?: Post; accent: string; background: string; onPress: () => void }) {
    return (
      <MotionPressable onPress={onPress} style={[styles.spotlight, { backgroundColor: background, borderColor: palette.line }]}>
        <View style={styles.spotlightLabel}><AppIcon name={icon} color={accent} size={14} /><Text style={[styles.spotlightEyebrow, { color: accent }]}>{label}</Text></View>
        <Text style={[styles.spotlightTitle, { color: palette.ink }]} numberOfLines={2}>{post?.title ?? "새 글을 둘러보세요"}</Text>
        <Text style={[styles.spotlightMeta, { color: palette.muted }]} numberOfLines={1}>{post ? `${post.region} · ${won(post.price)}` : "대전·세종 전체"}</Text>
        <View style={[styles.openPill, { backgroundColor: accent }]}><Text style={styles.openText}>둘러보기</Text></View>
      </MotionPressable>
    );
  }
}

const styles = StyleSheet.create({
  overview: { flex: 1, padding: 16, paddingTop: 12, paddingBottom: 92, justifyContent: "space-between" },
  block: { gap: 10 },
  regionButton: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 15, padding: 9 },
  pin: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  regionEyebrow: { fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  regionName: { fontSize: 12, fontWeight: "900", marginTop: 2 },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "900" },
  sectionCaption: { fontSize: 10, marginTop: 3 },
  spotlights: { flexDirection: "row", gap: 9 },
  spotlight: { flex: 1, minHeight: 126, borderWidth: 1, borderRadius: 20, padding: 12 },
  spotlightLabel: { flexDirection: "row", alignItems: "center", gap: 5 },
  spotlightEyebrow: { fontSize: 9, fontWeight: "900" },
  spotlightTitle: { minHeight: 38, fontSize: 12.5, lineHeight: 19, fontWeight: "800", marginTop: 9 },
  spotlightMeta: { minHeight: 12, fontSize: 9, marginTop: 4 },
  openPill: { alignSelf: "flex-start", marginTop: 8, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  openText: { color: "white", fontSize: 8, fontWeight: "900" },
  neighborhoodPulse: { minHeight: 64, borderWidth: 1, borderRadius: 17, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  pulseIntro: { width: 102 },
  pulseTitleRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 999 },
  pulseTitle: { fontSize: 11, fontWeight: "900" },
  pulseRegion: { fontSize: 8, marginTop: 4 },
  pulseDivider: { width: 1, height: 34 },
  pulseStat: { flex: 1, minHeight: 50, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  pulseValue: { fontSize: 15, fontWeight: "900" },
  pulseLabel: { fontSize: 8, fontWeight: "700", marginTop: 2 },
  activityGrid: { flexDirection: "row", gap: 7 },
  activityCard: { position: "relative", flex: 1, minHeight: 74, borderWidth: 1, borderRadius: 15, padding: 9 },
  activityIcon: { width: 24, height: 24, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  activityValue: { position: "absolute", right: 9, top: 8, fontSize: 16, fontWeight: "900" },
  activityLabel: { fontSize: 8, fontWeight: "700", marginTop: 9 },
  activityArrow: { position: "absolute", right: 8, bottom: 6, fontSize: 12 },
  guide: { flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderRadius: 17, padding: 11 },
  guideIcon: { width: 36, height: 36, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  guideTitle: { fontSize: 12, fontWeight: "900" },
  guideBody: { fontSize: 9, marginTop: 3 },
});
