import { Alert, StyleSheet, Text, View } from "react-native";
import { DetailScaffold } from "@/src/components/common/DetailScaffold";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";

// [내 정보] 프로필 사진, 인증, 신뢰도와 회원정보 수정 진입점입니다.
export function ProfileInfoScreen() {
  const { palette } = useTheme();
  const { nickname, region } = useAppData();
  return (
    <DetailScaffold title="내 정보" eyebrow="PROFILE">
      <View style={[styles.hero, { backgroundColor: palette.white, borderColor: palette.line }]}><MotionPressable onPress={() => Alert.alert("프로필 사진", "정식 저장소 연결 후 사진 보관 기능이 활성화됩니다.")} style={[styles.avatar, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontSize: 28, fontWeight: "900" }}>{nickname[0]}</Text><View style={[styles.plus, { backgroundColor: palette.lime }]}><Text style={{ color: "white" }}>＋</Text></View></MotionPressable><Text style={[styles.name, { color: palette.ink }]}>{nickname}</Text><Text style={[styles.sub, { color: palette.muted }]}>{region}</Text></View>
      <InfoRow label="닉네임" value={nickname} /><InfoRow label="본인 인증" value="휴대폰 인증 완료" /><InfoRow label="신뢰도" value="36.5 · 거래 8회" />
      <MotionPressable onPress={() => Alert.alert("회원정보 수정", "닉네임·연락처 수정 폼을 연결할 수 있어요.")} style={[styles.primary, { backgroundColor: palette.lime }]}><Text style={styles.primaryText}>회원정보 수정</Text></MotionPressable>
    </DetailScaffold>
  );
  function InfoRow({ label, value }: { label: string; value: string }) { return <View style={[styles.row, { backgroundColor: palette.white, borderColor: palette.line }]}><Text style={[styles.label, { color: palette.muted }]}>{label}</Text><Text style={[styles.value, { color: palette.ink }]}>{value}</Text></View>; }
}

// [차단 회원] 차단한 이용자와 해제 동작을 확인합니다.
export function BlockedUsersScreen() {
  const { palette } = useTheme();
  const users = ["빠른거래77", "직거래왕", "새벽연락금지"];
  return <DetailScaffold title="차단 회원" eyebrow="PRIVACY"><Text style={[styles.guide, { color: palette.muted }]}>차단한 회원의 글과 채팅은 표시되지 않아요.</Text>{users.map((user) => <View key={user} style={[styles.row, { backgroundColor: palette.white, borderColor: palette.line }]}><View style={[styles.smallAvatar, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontWeight: "900" }}>{user[0]}</Text></View><Text style={[styles.value, { color: palette.ink, flex: 1 }]}>{user}</Text><MotionPressable onPress={() => Alert.alert("차단 해제", `${user}님의 차단을 해제할까요?`)} style={[styles.outline, { borderColor: palette.line }]}><Text style={{ color: palette.muted, fontSize: 9, fontWeight: "800" }}>해제</Text></MotionPressable></View>)}</DetailScaffold>;
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", borderWidth: 1, borderRadius: 20, padding: 22 }, avatar: { position: "relative", width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" }, plus: { position: "absolute", right: 0, bottom: 0, width: 23, height: 23, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "white" }, name: { fontSize: 18, fontWeight: "900", marginTop: 12 }, sub: { fontSize: 10, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 62, borderWidth: 1, borderRadius: 15, padding: 13 }, label: { width: 72, fontSize: 10, fontWeight: "700" }, value: { fontSize: 12, fontWeight: "800" },
  primary: { alignItems: "center", borderRadius: 14, paddingVertical: 14 }, primaryText: { color: "white", fontSize: 12, fontWeight: "900" }, guide: { fontSize: 10, lineHeight: 16 }, smallAvatar: { width: 35, height: 35, borderRadius: 12, alignItems: "center", justifyContent: "center" }, outline: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
});
