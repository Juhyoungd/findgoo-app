import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppDataProvider } from "@/src/state/AppDataContext";
import { AuthProvider } from "@/src/state/AuthContext";
import { ToastProvider } from "@/src/state/ToastContext";
import { ThemeProvider } from "@/src/theme/ThemeContext";
import { PushNotificationBridge } from "@/src/components/notifications/PushNotificationBridge";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.desktopCanvas}>
        <View style={styles.appFrame}>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <AppDataProvider>
                  <PushNotificationBridge />
                  <StatusBar style="auto" />
                  <Stack screenOptions={{ headerShown: false }} />
                </AppDataProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

// [앱 화면 크기] 모바일에서는 전체 너비를 쓰고, 웹 데스크톱에서는 앱 너비로 중앙 고정합니다.
const styles = StyleSheet.create({
  desktopCanvas: { flex: 1, alignItems: "center", backgroundColor: "#ece8e4" },
  appFrame: { flex: 1, width: "100%", maxWidth: 480, overflow: "hidden", backgroundColor: "white", elevation: 8, ...Platform.select({ web: { boxShadow: "0 0 24px rgba(45,37,35,0.12)" }, default: { shadowColor: "#2d2523", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.12, shadowRadius: 24 } }) },
});
