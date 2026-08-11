import { Stack } from "expo-router";

// [1:1 거래 채팅] 목록(index) → 채팅방([conversationId]) 스택
export default function ChatStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
