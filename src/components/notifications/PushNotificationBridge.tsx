import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { isSupabaseConfigured } from "@/src/lib/supabase";
import { getNotificationRoute, registerPushToken } from "@/src/services/pushNotificationService";
import { useAppData } from "@/src/state/AppDataContext";
import { useAuth } from "@/src/state/AuthContext";

// [푸시 알림] 기기 토큰을 계정에 저장하고 알림을 눌렀을 때 관련 상세 화면으로 이동합니다.
export function PushNotificationBridge() {
  const router = useRouter();
  const { session } = useAuth();
  const { markNoticeRead } = useAppData();
  const handledResponseId = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!isSupabaseConfigured || !session) return;
    registerPushToken(session);
  }, [session]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    function open(response: Notifications.NotificationResponse | null) {
      if (!response || response.notification.request.identifier === handledResponseId.current) return;
      handledResponseId.current = response.notification.request.identifier;
      const noticeId = response.notification.request.content.data?.noticeId;
      if (typeof noticeId === "string") markNoticeRead(noticeId);
      const route = getNotificationRoute(response.notification);
      if (route) router.push(route as Href);
    }
    open(Notifications.getLastNotificationResponse());
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [markNoticeRead, router]);

  return null;
}
