import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { calculateMannerScore, getMannerLevel } from "@/src/utils/manner";
import type { MannerStats } from "@/src/types/findgoo";

export function MannerMeter({ stats, compact = false }: { stats: MannerStats; compact?: boolean }) {
  const { palette } = useTheme();
  const score = calculateMannerScore(stats);
  const level = getMannerLevel(score);

  return (
    <View style={styles.wrap} accessibilityLabel={`매너 온도 ${score}도, ${level.label}`}>
      <View style={styles.topRow}>
        <Text style={[styles.label, { color: palette.ink }]}>{level.icon} 매너 온도</Text>
        <Text style={[styles.score, { color: palette.limeDark }]}>{score.toFixed(1)}°</Text>
      </View>
      <View style={[styles.track, { backgroundColor: palette.line }, compact && styles.trackCompact]}>
        <View style={[styles.fill, { width: `${score}%`, backgroundColor: palette.lime }]} />
        <View style={[styles.baseMark, { left: "36.5%", backgroundColor: palette.ink }]} />
      </View>
      {!compact && <Text style={[styles.caption, { color: palette.muted }]}>기본 36.5°에서 거래·후기·급구 완료와 신고 내역을 반영해요.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 12, fontWeight: "800" },
  score: { fontSize: 19, fontWeight: "900" },
  track: { position: "relative", height: 10, borderRadius: 999, overflow: "hidden" },
  trackCompact: { height: 7 },
  fill: { height: "100%", borderRadius: 999 },
  baseMark: { position: "absolute", top: 0, bottom: 0, width: 2, opacity: 0.45 },
  caption: { fontSize: 9, lineHeight: 14 },
});
