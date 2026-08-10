import { Stack } from "expo-router";

// [마이페이지 상세] 구매글·급구·찜·알림 하위 화면의 스택 내비게이션
export default function MyDetailLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
