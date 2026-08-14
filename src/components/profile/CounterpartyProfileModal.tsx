import { Modal, Platform, StyleSheet, Text, View } from "react-native";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { MannerMeter } from "@/src/components/profile/MannerMeter";
import { ProfileAvatar } from "@/src/components/profile/ProfileAvatar";
import { useTheme } from "@/src/theme/ThemeContext";
import { getMannerHighlights } from "@/src/utils/manner";
import type { MemberProfile } from "@/src/types/findgoo";

type Props = {
  visible: boolean;
  profile: MemberProfile;
  postCount: number;
  onClose: () => void;
  onOpenPosts: () => void;
};

// [상대 프로필] 채팅을 벗어나지 않고 핵심 신뢰 정보를 확인하는 요약 모달입니다.
export function CounterpartyProfileModal({ visible, profile, postCount, onClose, onOpenPosts }: Props) {
  const { palette } = useTheme();
  const highlights = getMannerHighlights(profile.mannerStats);
  const joined = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(new Date(profile.joinedAt));

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <MotionPressable haptic="none" pressedScale={1} onPress={onClose} style={StyleSheet.absoluteFill} accessibilityLabel="프로필 닫기" />
        <View style={[styles.card, { backgroundColor: palette.white, borderColor: palette.line }, Platform.OS === "web" ? { boxShadow: `0 18px 48px ${palette.ink}24` } : { shadowColor: palette.ink }]}>
          <View style={styles.profileTop}>
            <ProfileAvatar nickname={profile.nickname} avatarUrl={profile.avatarUrl} size={64} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.nickname, { color: palette.ink }]}>{profile.nickname}</Text>
              <Text style={[styles.meta, { color: palette.muted }]}>{profile.recentRegion} · {joined} 가입</Text>
            </View>
            <MotionPressable onPress={onClose} style={[styles.close, { borderColor: palette.line }]} accessibilityLabel="프로필 닫기"><Text style={{ color: palette.muted, fontSize: 18 }}>×</Text></MotionPressable>
          </View>

          <MannerMeter stats={profile.mannerStats} />

          <View style={styles.stats}>
            <Stat label="거래 완료" value={`${profile.mannerStats.completedTrades}회`} />
            <Stat label="좋은 후기" value={`${profile.mannerStats.goodMannerReviews}개`} />
            <Stat label="급구 완료" value={`${profile.mannerStats.successfulUrgentMissions}회`} />
          </View>

          {highlights.length > 0 && (
            <View style={[styles.review, { backgroundColor: palette.paper }]}>
              <Text style={[styles.reviewTitle, { color: palette.ink }]}>최근 매너 평가</Text>
              {highlights.slice(0, 2).map((item) => <Text key={item.label} style={[styles.reviewText, { color: palette.muted }]}>✓ {item.label} {item.count}</Text>)}
            </View>
          )}

          <MotionPressable onPress={onOpenPosts} haptic="light" style={[styles.postsButton, { backgroundColor: palette.lime }]} accessibilityLabel={`${profile.nickname}님이 작성한 게시글 ${postCount}개 보기`}>
            <Text style={{ color: palette.white, fontSize: 12, fontWeight: "900" }}>작성한 게시글 {postCount}개 보기</Text>
          </MotionPressable>
        </View>
      </View>
    </Modal>
  );

  function Stat({ label, value }: { label: string; value: string }) {
    return <View style={[styles.stat, { backgroundColor: palette.paper }]}><Text style={[styles.statValue, { color: palette.ink }]}>{value}</Text><Text style={[styles.statLabel, { color: palette.muted }]}>{label}</Text></View>;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", padding: 22, backgroundColor: "rgba(25,22,28,0.38)" },
  card: { borderWidth: 1, borderRadius: 26, padding: 20, gap: 18, elevation: 18, ...Platform.select({ web: {}, default: { shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.18, shadowRadius: 36 } }) },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  nickname: { fontSize: 18, fontWeight: "900" },
  meta: { fontSize: 9, marginTop: 5 },
  close: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, alignItems: "center", borderRadius: 14, paddingVertical: 11 },
  statValue: { fontSize: 13, fontWeight: "900" },
  statLabel: { fontSize: 8, marginTop: 3 },
  review: { borderRadius: 15, padding: 13, gap: 6 },
  reviewTitle: { fontSize: 11, fontWeight: "900", marginBottom: 2 },
  reviewText: { fontSize: 9 },
  postsButton: { alignItems: "center", borderRadius: 15, paddingVertical: 14 },
});
