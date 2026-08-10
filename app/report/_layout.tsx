import { Stack } from "expo-router";

// [신고] 채팅 상대 신고 작성 화면 스택
export default function ReportLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
