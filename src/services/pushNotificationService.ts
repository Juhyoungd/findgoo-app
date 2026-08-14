import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }),
  });
}

export async function registerPushToken(session: Session) {
  if (Platform.OS === "web" || !Device.isDevice) return { error: null };
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("transactions", {
      name: "거래·채팅 알림",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 80, 180],
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return { error: "알림 권한이 꺼져 있어요. 기기 설정에서 허용할 수 있어요." };
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return { error: "EAS projectId가 없어 푸시 토큰을 만들 수 없어요." };
  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const { error } = await supabase.from("device_push_tokens").upsert({
      user_id: session.user.id,
      expo_push_token: token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    }, { onConflict: "expo_push_token" });
    return { error: error?.message ?? null };
  } catch {
    return { error: "네트워크가 연결되면 푸시 알림 등록을 다시 시도할게요." };
  }
}

export function getNotificationRoute(notification: Notifications.Notification) {
  const route = notification.request.content.data?.route;
  return typeof route === "string" && route.startsWith("/") ? route : null;
}
