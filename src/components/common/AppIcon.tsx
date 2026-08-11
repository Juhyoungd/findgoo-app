import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { AppIconName } from "@/src/assets/app-icons";

type AppIconProps = {
  name: AppIconName;
  color: string;
  size?: number;
  strokeWidth?: number;
};

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const iconName: Record<AppIconName, IoniconName> = {
  home: "home-outline",
  urgent: "time-outline",
  search: "search-outline",
  create: "add-outline",
  chat: "chatbubble-ellipses-outline",
  bell: "notifications-outline",
  saved: "bookmark-outline",
  back: "chevron-back-outline",
  send: "arrow-up-outline",
  close: "close-outline",
  done: "checkmark-circle-outline",
};

// [공통 아이콘] Expo Ionicons의 동일한 선형 계열만 사용해 전 화면의 모양과 정렬을 통일합니다.
export function AppIcon({ name, color, size = 20 }: AppIconProps) {
  return (
    <View style={[styles.frame, { width: size, height: size, pointerEvents: "none" }]}>
      <Ionicons name={iconName[name]} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: "center", justifyContent: "center" },
});
