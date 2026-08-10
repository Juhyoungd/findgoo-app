import { Alert, StyleSheet, Text, View } from "react-native";
import { DetailScaffold } from "@/src/components/common/DetailScaffold";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useTheme } from "@/src/theme/ThemeContext";

const faq = ["제안 수락 후 거래는 어떻게 진행하나요?", "대리구매 실비는 어떻게 정산하나요?", "신고하면 상대방에게 알려지나요?", "지역과 키워드 알림을 바꾸고 싶어요"];
const announcements = [
  { title: "대전·세종 베타 서비스 지역 안내", date: "오늘", tag: "서비스" },
  { title: "안전한 대리구매 거래 체크리스트", date: "1일 전", tag: "안전" },
  { title: "새로운 5가지 색상 테마가 추가됐어요", date: "2일 전", tag: "업데이트" },
  { title: "신고·차단 정책 개정 사전 안내", date: "3일 전", tag: "정책" },
  { title: "채팅 이미지 전송 점검 안내", date: "5일 전", tag: "점검" },
];

// [고객센터] FAQ, 1:1 문의 작성과 문의 내역 진입점입니다.
export function SupportScreen() {
  const { palette } = useTheme();
  return <DetailScaffold title="고객센터" eyebrow="HELP CENTER"><View style={styles.quick}><Quick title="1:1 문의" caption="새 문의 작성" icon="＋" onPress={() => Alert.alert("1:1 문의", "문의 작성 화면을 연결할 수 있어요.")} /><Quick title="문의 내역" caption="답변 상태 확인" icon="✓" onPress={() => Alert.alert("문의 내역", "답변 대기 1건 · 답변 완료 2건")} /></View><Text style={[styles.sectionTitle, { color: palette.ink }]}>자주 묻는 질문</Text>{faq.map((item) => <MotionPressable key={item} onPress={() => Alert.alert(item, "상세 답변을 준비 중입니다. 정식 운영 정책과 함께 연결됩니다.")} style={[styles.row, { backgroundColor: palette.white, borderColor: palette.line }]}><Text style={[styles.rowTitle, { color: palette.ink }]}>{item}</Text><Text style={{ color: palette.muted }}>›</Text></MotionPressable>)}</DetailScaffold>;
  function Quick({ title, caption, icon, onPress }: { title: string; caption: string; icon: string; onPress: () => void }) { return <MotionPressable onPress={onPress} style={[styles.quickCard, { backgroundColor: palette.white, borderColor: palette.line }]}><View style={[styles.quickIcon, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontWeight: "900" }}>{icon}</Text></View><Text style={[styles.quickTitle, { color: palette.ink }]}>{title}</Text><Text style={[styles.caption, { color: palette.muted }]}>{caption}</Text></MotionPressable>; }
}

// [공지사항] 운영 공지와 업데이트 예시를 확인합니다.
export function NoticesScreen() {
  const { palette } = useTheme();
  return <DetailScaffold title="공지사항" eyebrow="NOTICE">{announcements.map((item) => <MotionPressable key={item.title} onPress={() => Alert.alert(item.title, "공지 상세 내용이 여기에 표시됩니다.")} style={[styles.row, { backgroundColor: palette.white, borderColor: palette.line }]}><View style={[styles.noticeTag, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontSize: 8, fontWeight: "900" }}>{item.tag}</Text></View><View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: palette.ink }]}>{item.title}</Text><Text style={[styles.caption, { color: palette.muted }]}>{item.date}</Text></View><Text style={{ color: palette.muted }}>›</Text></MotionPressable>)}</DetailScaffold>;
}

// [안전 거래 가이드] 구매·급구·대리구매 전에 확인할 핵심 원칙입니다.
export function SafetyScreen() {
  const { palette } = useTheme();
  const checks = [{ title: "제안 내용부터 채팅에 남기기", body: "금액·실비·마감 시간과 전달 방식을 거래 채팅에서 합의하세요." }, { title: "선입금 전 상대 신뢰도 확인", body: "거래 횟수와 후기, 신고 이력을 확인하고 외부 메신저 이동을 피하세요." }, { title: "현장 인증과 영수증 보관", body: "대리구매·심부름은 도착 사진과 영수증을 채팅에 남겨 분쟁을 줄이세요." }, { title: "이상 징후는 즉시 신고", body: "과도한 개인정보나 계좌 접근을 요구하면 거래를 중단하고 신고하세요." }];
  return <DetailScaffold title="안전 거래 가이드" eyebrow="SAFE TRADE"><View style={[styles.safetyHero, { backgroundColor: palette.ink }]}><Text style={styles.safetyTitle}>거래 전 30초만 확인해요.</Text><Text style={styles.safetyBody}>사람의 시간과 대리구매가 오가는 만큼 기록이 가장 좋은 안전장치예요.</Text></View>{checks.map((item, index) => <View key={item.title} style={[styles.check, { backgroundColor: palette.white, borderColor: palette.line }]}><View style={[styles.checkNumber, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontWeight: "900" }}>{index + 1}</Text></View><View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: palette.ink }]}>{item.title}</Text><Text style={[styles.checkBody, { color: palette.muted }]}>{item.body}</Text></View></View>)}</DetailScaffold>;
}

const styles = StyleSheet.create({
  quick: { flexDirection: "row", gap: 9 }, quickCard: { flex: 1, borderWidth: 1, borderRadius: 17, padding: 14 }, quickIcon: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 9 }, quickTitle: { fontSize: 12, fontWeight: "900" }, sectionTitle: { fontSize: 15, fontWeight: "900", marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 65, borderWidth: 1, borderRadius: 15, padding: 13 }, rowTitle: { flex: 1, fontSize: 12, fontWeight: "800" }, caption: { fontSize: 9, marginTop: 4 }, noticeTag: { minWidth: 45, alignItems: "center", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 },
  safetyHero: { borderRadius: 20, padding: 19 }, safetyTitle: { color: "white", fontSize: 18, fontWeight: "900" }, safetyBody: { color: "rgba(255,255,255,0.65)", fontSize: 10, lineHeight: 16, marginTop: 7 }, check: { flexDirection: "row", alignItems: "flex-start", gap: 11, borderWidth: 1, borderRadius: 16, padding: 14 }, checkNumber: { width: 31, height: 31, borderRadius: 11, alignItems: "center", justifyContent: "center" }, checkBody: { fontSize: 10, lineHeight: 16, marginTop: 5 },
});
