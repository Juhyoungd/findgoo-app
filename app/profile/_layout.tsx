import { Stack } from "expo-router";

// [내 정보] 프로필과 설정 하위 화면 스택
export default function ProfileLayout() { return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />; }
