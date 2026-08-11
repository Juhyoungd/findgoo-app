import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appIcons } from "@/src/assets/app-icons";
import { AppIcon } from "@/src/components/common/AppIcon";
import { MotionPressable as Pressable } from "@/src/components/common/MotionPressable";
import { useTheme } from "@/src/theme/ThemeContext";

type Notification = { title: string; body: string; onPress?: () => void };

type ToastContextValue = {
  showToast: (message: string) => void;
  showNotification: (input: Notification) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const useNativeDriver = Platform.OS !== "web";

// [토스트/알림] Alert.alert가 웹에서 놓치기 쉬운 짧은 안내(입력 검증 등)는 화면 하단 토스트로,
// 새 채팅 메시지처럼 다른 화면에 있어도 바로 알려줘야 하는 건 화면 상단 알림 배너로 보여줍니다.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [notification, setNotification] = useState<Notification | null>(null);
  const notificationY = useRef(new Animated.Value(-120)).current;
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (next: string) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setMessage(next);
      toastOpacity.setValue(0);
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver }).start();
      toastTimer.current = setTimeout(() => {
        Animated.timing(toastOpacity, { toValue: 0, duration: 220, useNativeDriver }).start(() => setMessage(null));
      }, 2200);
    },
    [toastOpacity],
  );

  const dismissNotification = useCallback(() => {
    if (notificationTimer.current) clearTimeout(notificationTimer.current);
    Animated.timing(notificationY, { toValue: -120, duration: 200, useNativeDriver }).start(() => setNotification(null));
  }, [notificationY]);

  const showNotification = useCallback(
    (next: Notification) => {
      if (notificationTimer.current) clearTimeout(notificationTimer.current);
      setNotification(next);
      notificationY.setValue(-120);
      Animated.spring(notificationY, { toValue: 0, speed: 16, bounciness: 4, useNativeDriver }).start();
      notificationTimer.current = setTimeout(dismissNotification, 3500);
    },
    [notificationY, dismissNotification],
  );

  return (
    <ToastContext.Provider value={{ showToast, showNotification }}>
      {children}
      {message && <ToastBanner message={message} opacity={toastOpacity} />}
      {notification && <NotificationBanner notification={notification} translateY={notificationY} onDismiss={dismissNotification} />}
    </ToastContext.Provider>
  );
}

function ToastBanner({ message, opacity }: { message: string; opacity: Animated.Value }) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Animated.View style={[styles.toastWrap, { opacity, bottom: insets.bottom + 90, pointerEvents: "none" }]}>
      <Animated.View style={[styles.bubble, { backgroundColor: palette.ink }]}>
        <Text style={styles.toastText}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
}

function NotificationBanner({ notification, translateY, onDismiss }: { notification: Notification; translateY: Animated.Value; onDismiss: () => void }) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  function handlePress() {
    onDismiss();
    notification.onPress?.();
  }

  return (
    <Animated.View style={[styles.notificationWrap, { top: insets.top + 8, transform: [{ translateY }], pointerEvents: "box-none" }]}>
      <Pressable
        haptic="light"
        onPress={handlePress}
        style={[styles.notificationCard, { backgroundColor: palette.white, borderColor: palette.line }]}
        accessibilityRole="button"
        accessibilityLabel={`${notification.title} 알림, ${notification.body}`}
      >
        <View style={[styles.notificationIcon, { borderColor: palette.line }]}>
          <AppIcon name={appIcons.bell} color={palette.ink} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.notificationTitle, { color: palette.ink }]} numberOfLines={1}>{notification.title}</Text>
          <Text style={{ color: palette.muted, fontSize: 11 }} numberOfLines={1}>{notification.body}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrap: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 999 },
  bubble: { maxWidth: "88%", borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12 },
  toastText: { color: "white", fontSize: 13, fontWeight: "700", textAlign: "center" },
  notificationWrap: { position: "absolute", left: 12, right: 12, zIndex: 999 },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 22,
    padding: 12,
    elevation: 7,
    ...Platform.select({
      web: { boxShadow: "0 8px 20px rgba(39,31,48,0.1)" },
      default: { shadowColor: "#271f30", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20 },
    }),
  },
  notificationIcon: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  notificationTitle: { fontSize: 13, fontWeight: "800" },
});

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast는 ToastProvider 안에서만 사용할 수 있어요.");
  return context;
}
