import { Stack } from "expo-router";

// [관리자] 대시보드와 관리 모듈의 스택 내비게이션
export default function AdminLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
