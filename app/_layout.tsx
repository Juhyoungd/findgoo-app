import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppDataProvider } from "@/src/state/AppDataContext";
import { ThemeProvider } from "@/src/theme/ThemeContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppDataProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} />
        </AppDataProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
