import { useMemo } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BackgroundBlobs } from "@/src/components/common/BackgroundBlobs";
import { HomeOverview } from "@/src/components/home/HomeOverview";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";

export default function HomeScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { region, posts, savedPostIds, offers } = useAppData();

  const activeTradeCount = useMemo(() => offers.filter((offer) => offer.status === "accepted").length, [offers]);
  const pendingIncomingCount = useMemo(() => offers.filter((offer) => offer.direction === "incoming" && offer.status === "pending").length, [offers]);
  const outgoingPendingCount = useMemo(() => offers.filter((offer) => offer.direction === "outgoing" && offer.status === "pending").length, [offers]);
  const savedCount = useMemo(() => posts.filter((post) => savedPostIds.includes(post.id)).length, [posts, savedPostIds]);
  const openUrgentCount = useMemo(() => posts.filter((post) => post.type === "urgent" && post.status === "open").length, [posts]);
  const openBuyCount = useMemo(() => posts.filter((post) => post.type === "buy" && post.status === "open").length, [posts]);

  const featuredUrgent = posts.find((post) => post.type === "urgent" && post.status === "open");
  const featuredBuy = posts.find((post) => post.type === "buy" && post.status === "open");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <BackgroundBlobs />
      <AppHeader />
      <View style={{ flex: 1 }}>
        <HomeOverview
          region={region}
          featuredUrgent={featuredUrgent}
          featuredBuy={featuredBuy}
          activeTradeCount={activeTradeCount}
          pendingIncomingCount={pendingIncomingCount}
          outgoingPendingCount={outgoingPendingCount}
          savedCount={savedCount}
          openUrgentCount={openUrgentCount}
          openBuyCount={openBuyCount}
          onOpenRegion={() => router.push("/profile/region")}
          onOpenUrgent={() => router.push("/market")}
          onOpenBuy={() => router.push("/buy")}
          onOpenSafety={() => router.push("/support/safety")}
          onOpenActiveTrades={() => router.push("/my/transactions")}
          onOpenIncomingOffers={() => router.push("/offers/received")}
          onOpenOutgoingOffers={() => router.push("/offers/sent")}
          onOpenSaved={() => router.push("/my/saved")}
        />
      </View>
    </SafeAreaView>
  );
}
