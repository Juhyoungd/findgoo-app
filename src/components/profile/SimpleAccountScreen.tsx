import { Alert, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { DetailScaffold } from "@/src/components/common/DetailScaffold";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { MannerMeter } from "@/src/components/profile/MannerMeter";
import { ProfileAvatar } from "@/src/components/profile/ProfileAvatar";
import { useAppData } from "@/src/state/AppDataContext";
import { useAuth } from "@/src/state/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { getMannerHighlights } from "@/src/utils/manner";

// [내 정보] 프로필·활동 지역·매너 평가와 회원정보 수정 진입점을 한 화면에 제공합니다.
export function ProfileInfoScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const { nickname, selectedRegions, posts } = useAppData();
  const stats = profile?.mannerStats ?? { completedTrades: 0, goodMannerReviews: 0, successfulUrgentMissions: 0, mannerReports: 0 };
  const highlights = getMannerHighlights(stats);
  const joined = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(new Date(profile?.createdAt ?? Date.now()));
  const myPostCount = posts.filter((post) => post.mine).length;

  return (
    <DetailScaffold title="내 정보" eyebrow="PROFILE">
      <View style={[styles.hero, { backgroundColor: palette.white, borderColor: palette.line }]}>
        <ProfileAvatar nickname={nickname} avatarUrl={profile?.avatarUrl} size={78} />
        <Text style={[styles.name, { color: palette.ink }]}>{nickname}</Text>
        <Text style={[styles.sub, { color: palette.muted }]}>{profile?.name ?? "본인 인증 회원"} · {selectedRegions[0]}</Text>
        <MotionPressable onPress={() => router.push("/profile/edit")} style={[styles.edit, { backgroundColor: palette.paper, borderColor: palette.line }]}>
          <Text style={{ color: palette.ink, fontSize: 10, fontWeight: "900" }}>회원정보 수정</Text>
        </MotionPressable>
      </View>

      <View style={[styles.mannerCard, { backgroundColor: palette.white, borderColor: palette.line }]}>
        <MannerMeter stats={stats} />
        <View style={styles.statRow}>
          <MiniStat label="거래 완료" value={`${stats.completedTrades}회`} />
          <MiniStat label="좋은 후기" value={`${stats.goodMannerReviews}개`} />
          <MiniStat label="급구 완료" value={`${stats.successfulUrgentMissions}회`} />
          <MiniStat label="신고" value={`${stats.mannerReports}건`} warning={stats.mannerReports > 0} />
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: palette.white, borderColor: palette.line }]}>
        <InfoRow label="자주 거래하는 동네" value={selectedRegions.join(" · ")} />
        <InfoRow label="회원가입일" value={joined} />
        <InfoRow label="본인 인증" value="휴대폰 인증 완료" />
      </View>

      <View style={[styles.reviewCard, { backgroundColor: palette.white, borderColor: palette.line }]}>
        <Text style={[styles.sectionTitle, { color: palette.ink }]}>받은 매너 평가</Text>
        {highlights.length ? highlights.map((item) => (
          <View key={item.label} style={styles.reviewRow}><Text style={{ color: palette.lime, fontWeight: "900" }}>✓</Text><Text style={[styles.reviewLabel, { color: palette.muted }]}>{item.label}</Text><Text style={[styles.reviewCount, { color: palette.ink }]}>{item.count}</Text></View>
        )) : <Text style={[styles.guide, { color: palette.muted }]}>거래 후 받은 매너 평가가 여기에 표시돼요.</Text>}
      </View>

      <MotionPressable onPress={() => router.push({ pathname: "/profile/member", params: { userId: "me" } })} style={[styles.primary, { backgroundColor: palette.lime }]}>
        <Text style={[styles.primaryText, { color: palette.white }]}>작성한 게시글 {myPostCount}개 보기</Text>
      </MotionPressable>
    </DetailScaffold>
  );

  function MiniStat({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
    return <View style={[styles.miniStat, { backgroundColor: palette.paper }]}><Text style={{ color: warning ? palette.orange : palette.ink, fontSize: 12, fontWeight: "900" }}>{value}</Text><Text style={{ color: palette.muted, fontSize: 8 }}>{label}</Text></View>;
  }

  function InfoRow({ label, value }: { label: string; value: string }) {
    return <View style={[styles.row, { borderBottomColor: palette.line }]}><Text style={[styles.label, { color: palette.muted }]}>{label}</Text><Text style={[styles.value, { color: palette.ink }]}>{value}</Text></View>;
  }
}

// [차단 회원] 차단한 이용자와 해제 동작을 확인합니다.
export function BlockedUsersScreen() {
  const { palette } = useTheme();
  const { blockedMembers, unblockMember } = useAppData();
  return <DetailScaffold title="차단 회원" eyebrow="PRIVACY"><Text style={[styles.guide, { color: palette.muted }]}>차단한 회원의 글과 채팅은 표시되지 않아요.</Text>{blockedMembers.length === 0 && <View style={[styles.empty, { borderColor: palette.line }]}><Text style={[styles.guide, { color: palette.muted }]}>차단한 회원이 없어요.</Text></View>}{blockedMembers.map((user) => <View key={user.id} style={[styles.blockedRow, { backgroundColor: palette.white, borderColor: palette.line }]}><ProfileAvatar nickname={user.nickname} avatarUrl={user.avatarUrl} size={35} /><Text style={[styles.value, { color: palette.ink, flex: 1 }]}>{user.nickname}</Text><MotionPressable onPress={() => Alert.alert("차단 해제", `${user.nickname}님의 차단을 해제할까요?`, [{ text: "취소", style: "cancel" }, { text: "해제", onPress: () => unblockMember(user.id) }])} style={[styles.outline, { borderColor: palette.line }]}><Text style={{ color: palette.muted, fontSize: 9, fontWeight: "800" }}>해제</Text></MotionPressable></View>)}</DetailScaffold>;
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", borderWidth: 1, borderRadius: 22, padding: 22 },
  name: { fontSize: 19, fontWeight: "900", marginTop: 12 },
  sub: { fontSize: 10, marginTop: 4 },
  edit: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, marginTop: 13 },
  mannerCard: { borderWidth: 1, borderRadius: 20, padding: 17, gap: 15 },
  statRow: { flexDirection: "row", gap: 6 },
  miniStat: { flex: 1, minHeight: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 3 },
  infoCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14 },
  row: { minHeight: 58, gap: 7, justifyContent: "center", borderBottomWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 9, fontWeight: "700" },
  value: { fontSize: 11, fontWeight: "800", lineHeight: 16 },
  reviewCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 11 },
  sectionTitle: { fontSize: 13, fontWeight: "900" },
  reviewRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewLabel: { flex: 1, fontSize: 10 },
  reviewCount: { fontSize: 11, fontWeight: "900" },
  primary: { alignItems: "center", borderRadius: 15, paddingVertical: 14 },
  primaryText: { fontSize: 12, fontWeight: "900" },
  guide: { fontSize: 10, lineHeight: 16 },
  blockedRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 62, borderWidth: 1, borderRadius: 15, padding: 13 },
  outline: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  empty: { alignItems: "center", borderWidth: 1, borderStyle: "dashed", borderRadius: 16, padding: 24 },
});
