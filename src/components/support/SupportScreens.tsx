import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { DetailScaffold } from "@/src/components/common/DetailScaffold";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useTheme } from "@/src/theme/ThemeContext";

const faq = [
  { title: "제안 수락 후 거래는 어떻게 진행하나요?", body: "제안을 수락하면 거래와 1:1 채팅방이 만들어집니다. 채팅에서 시간·장소를 합의하고 진행 중, 완료 순으로 상태를 바꿔주세요." },
  { title: "대리구매 실비는 어떻게 정산하나요?", body: "상품값과 수고비를 제안 내용에 나눠 적고 영수증 사진을 채팅에 남겨주세요. 합의하지 않은 추가 비용은 먼저 송금하지 마세요." },
  { title: "신고하면 상대방에게 알려지나요?", body: "신고자의 이름과 상세 내용은 상대에게 직접 공개되지 않습니다. 운영자가 안전 확인에 필요한 범위에서만 검토합니다." },
  { title: "지역과 키워드 알림을 바꾸고 싶어요", body: "마이페이지의 활동 지역과 관심 설정에서 변경할 수 있습니다. 지역은 선택 후 반드시 적용하기를 눌러주세요." },
];
const announcements = [
  { title: "대전·세종 서비스 지역 안내", date: "오늘", tag: "서비스", body: "대전은 5개 구의 동 단위, 세종은 동·읍·면 단위로 최대 3곳까지 설정할 수 있습니다." },
  { title: "안전한 대리구매 거래 체크리스트", date: "1일 전", tag: "안전", body: "금액과 실비, 마감 시간, 전달 방법을 채팅에 남기고 영수증과 현장 사진을 보관해주세요." },
  { title: "채팅 이미지 전송 기능 안내", date: "2일 전", tag: "업데이트", body: "거래 채팅에서 사진을 선택해 영수증과 물품 상태를 공유할 수 있습니다." },
];

export function SupportScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  return <DetailScaffold title="고객센터" eyebrow="HELP CENTER"><View style={styles.quick}><Quick title="1:1 문의" caption="새 문의 작성" icon="＋" onPress={() => router.push("/support/inquiry")} /><Quick title="문의 내역" caption="답변 상태 확인" icon="✓" onPress={() => router.push("/support/history")} /></View><Text style={[styles.sectionTitle, { color: palette.ink }]}>자주 묻는 질문</Text>{faq.map((item) => <View key={item.title} style={[styles.expandCard, { backgroundColor: palette.white, borderColor: palette.line }]}><MotionPressable onPress={() => setOpen(open === item.title ? null : item.title)} style={styles.row}><Text style={[styles.rowTitle, { color: palette.ink }]}>{item.title}</Text><Text style={{ color: palette.muted }}>{open === item.title ? "−" : "+"}</Text></MotionPressable>{open === item.title && <Text style={[styles.expandedBody, { color: palette.muted, borderTopColor: palette.line }]}>{item.body}</Text>}</View>)}</DetailScaffold>;
  function Quick({ title, caption, icon, onPress }: { title: string; caption: string; icon: string; onPress: () => void }) { return <MotionPressable onPress={onPress} style={[styles.quickCard, { backgroundColor: palette.white, borderColor: palette.line }]}><View style={[styles.quickIcon, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontWeight: "900" }}>{icon}</Text></View><Text style={[styles.quickTitle, { color: palette.ink }]}>{title}</Text><Text style={[styles.caption, { color: palette.muted }]}>{caption}</Text></MotionPressable>; }
}

export function NoticesScreen() {
  const { palette } = useTheme();
  const [open, setOpen] = useState<string | null>(null);
  return <DetailScaffold title="공지사항" eyebrow="NOTICE">{announcements.map((item) => <View key={item.title} style={[styles.expandCard, { backgroundColor: palette.white, borderColor: palette.line }]}><MotionPressable onPress={() => setOpen(open === item.title ? null : item.title)} style={styles.row}><View style={[styles.noticeTag, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontSize: 8, fontWeight: "900" }}>{item.tag}</Text></View><View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: palette.ink }]}>{item.title}</Text><Text style={[styles.caption, { color: palette.muted }]}>{item.date}</Text></View><Text style={{ color: palette.muted }}>{open === item.title ? "−" : "+"}</Text></MotionPressable>{open === item.title && <Text style={[styles.expandedBody, { color: palette.muted, borderTopColor: palette.line }]}>{item.body}</Text>}</View>)}</DetailScaffold>;
}

export function SafetyScreen() {
  const { palette } = useTheme();
  const checks = [{ title: "제안 내용부터 채팅에 남기기", body: "금액·실비·마감 시간과 전달 방식을 거래 채팅에서 합의하세요." }, { title: "선입금 전 상대 신뢰도 확인", body: "거래 횟수와 후기, 신고 이력을 확인하고 외부 메신저 이동을 피하세요." }, { title: "현장 인증과 영수증 보관", body: "대리구매·심부름은 도착 사진과 영수증을 채팅에 남겨 분쟁을 줄이세요." }, { title: "이상 징후는 즉시 신고", body: "과도한 개인정보나 계좌 접근을 요구하면 거래를 중단하고 신고하세요." }];
  return <DetailScaffold title="안전 거래 가이드" eyebrow="SAFE TRADE"><View style={[styles.safetyHero, { backgroundColor: palette.ink }]}><Text style={styles.safetyTitle}>거래 전 30초만 확인해요.</Text><Text style={styles.safetyBody}>사람의 시간과 대리구매가 오가는 만큼 기록이 가장 좋은 안전장치예요.</Text></View>{checks.map((item, index) => <View key={item.title} style={[styles.check, { backgroundColor: palette.white, borderColor: palette.line }]}><View style={[styles.checkNumber, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontWeight: "900" }}>{index + 1}</Text></View><View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: palette.ink }]}>{item.title}</Text><Text style={[styles.checkBody, { color: palette.muted }]}>{item.body}</Text></View></View>)}</DetailScaffold>;
}

const styles = StyleSheet.create({ quick: { flexDirection: "row", gap: 9 }, quickCard: { flex: 1, borderWidth: 1, borderRadius: 17, padding: 14 }, quickIcon: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 9 }, quickTitle: { fontSize: 12, fontWeight: "900" }, sectionTitle: { fontSize: 15, fontWeight: "900", marginTop: 4 }, expandCard: { borderWidth: 1, borderRadius: 15, overflow: "hidden" }, row: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 64, padding: 13 }, rowTitle: { flex: 1, fontSize: 12, fontWeight: "800" }, caption: { fontSize: 9, marginTop: 4 }, expandedBody: { borderTopWidth: 1, padding: 14, fontSize: 10, lineHeight: 17 }, noticeTag: { minWidth: 45, alignItems: "center", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 }, safetyHero: { borderRadius: 20, padding: 19 }, safetyTitle: { color: "white", fontSize: 18, fontWeight: "900" }, safetyBody: { color: "rgba(255,255,255,0.65)", fontSize: 10, lineHeight: 16, marginTop: 7 }, check: { flexDirection: "row", alignItems: "flex-start", gap: 11, borderWidth: 1, borderRadius: 16, padding: 14 }, checkNumber: { width: 31, height: 31, borderRadius: 11, alignItems: "center", justifyContent: "center" }, checkBody: { fontSize: 10, lineHeight: 16, marginTop: 5 } });
