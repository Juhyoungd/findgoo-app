import { useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BackgroundBlobs } from "@/src/components/common/BackgroundBlobs";
import { HomeOverview } from "@/src/components/home/HomeOverview";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";
import type { PostType } from "@/src/types/findgoo";

export default function HomeScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { region, posts, savedPostIds, messages } = useAppData();
  const [query, setQuery] = useState("");

  const chatCount = useMemo(() => new Set(messages.map((message) => message.postId)).size, [messages]);
  const savedUrgentCount = useMemo(
    () => posts.filter((post) => post.type === "urgent" && savedPostIds.includes(post.id)).length,
    [posts, savedPostIds],
  );

  function goToCreate(type: PostType) {
    router.push({ pathname: "/create", params: { type } });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <BackgroundBlobs />
      <AppHeader />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 110 }} keyboardShouldPersistTaps="handled">
        <HomeOverview
          region={region}
          query={query}
          onChangeQuery={setQuery}
          onCreatePost={goToCreate}
          chatCount={chatCount}
          pendingIncomingCount={0}
          outgoingPendingCount={0}
          savedUrgentCount={savedUrgentCount}
          onOpenChat={() => router.push("/chat")}
          onOpenTrade={() => router.push("/my")}
          onOpenMy={() => router.push("/my")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
