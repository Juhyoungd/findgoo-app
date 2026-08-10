import { Stack } from "expo-router";

// [판매 제안] 받은 제안·보낸 제안·상세 화면 스택
export default function OfferLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
