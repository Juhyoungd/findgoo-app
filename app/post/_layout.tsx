import { Stack } from "expo-router";

// [게시글 상세] 구매글/급구 카드에서 들어오는 화면 스택
export default function PostLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
