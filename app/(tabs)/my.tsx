import { useMemo, type ReactNode } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { useAppData } from "@/src/state/AppDataContext";
import { useAuth } from "@/src/state/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";
import type { AppNotice, Post } from "@/src/types/findgoo";

const noticeIcon: Record<AppNotice["kind"], string> = {
  offer: "⇄", trade: "✓", chat: "●", favorite: "♥", keyword: "⌕", urgent: "ϟ", system: "♧",
};

// [마이페이지] 프로필, 내가 쓴 글, 찜한 글, 알림을 모은 화면 (웹 MyPageModal의 RN 버전)
export default function MyScreen() {
  const { palette, activeTheme, nextTheme, cycleTheme } = useTheme();
  const { nickname, region, posts, savedPostIds, notices, markNoticeRead, unreadNoticeCount } = useAppData();
  const { signOut } = useAuth();

  const myPosts = useMemo(() => posts.filter((post) => post.mine), [posts]);
  const buyPostCount = myPosts.filter((post) => post.type === "buy").length;
  const urgentPostCount = myPosts.filter((post) => post.type === "urgent").length;
  const savedPosts = useMemo(() => posts.filter((post) => savedPostIds.includes(post.id)), [posts, savedPostIds]);

  function openPost(post: Post) {
    Alert.alert(post.title, `${post.description}\n\n${post.type === "buy" ? "희망 가격" : "지원 금액"}: ${won(post.price)}`);
  }

  function openNotice(notice: AppNotice) {
    markNoticeRead(notice.id);
    Alert.alert(notice.title, notice.body);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <View style={[styles.avatar, { backgroundColor: palette.blue }]}>
            <Text style={{ color: palette.lime, fontSize: 20, fontWeight: "700" }}>{nickname[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.nickname, { color: palette.ink }]}>{nickname}</Text>
            <Text style={{ color: palette.muted, fontSize: 12 }}>⌖ {region}</Text>
          </View>
          <Pressable onPress={cycleTheme} style={[styles.themeButton, { borderColor: palette.line }]}>
            <Text style={{ fontSize: 14 }}>{activeTheme.icon}</Text>
            <Text style={{ color: palette.muted, fontSize: 10 }}>{activeTheme.label} → {nextTheme.label}</Text>
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <SummaryStat label="구매글" value={buyPostCount} palette={palette} />
          <SummaryStat label="급구" value={urgentPostCount} palette={palette} />
          <SummaryStat label="찜한 글" value={savedPosts.length} palette={palette} />
          <SummaryStat label="안읽은 알림" value={unreadNoticeCount} palette={palette} />
        </View>

        <Section title="내가 쓴 글" palette={palette}>
          {myPosts.length === 0 && <EmptyRow text="아직 작성한 글이 없어요." palette={palette} />}
          {myPosts.map((post) => (
            <Pressable key={post.id} onPress={() => openPost(post)} style={[styles.row, { borderColor: palette.line }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: palette.ink }]} numberOfLines={1}>{post.title}</Text>
                <Text style={{ color: palette.muted, fontSize: 11 }}>{post.type === "buy" ? "구매글" : "급구"} · {won(post.price)}</Text>
              </View>
              <Text style={{ color: palette.muted, fontSize: 15 }}>›</Text>
            </Pressable>
          ))}
        </Section>

        <Section title="찜한 글" palette={palette}>
          {savedPosts.length === 0 && <EmptyRow text="찜한 글이 없어요." palette={palette} />}
          {savedPosts.map((post) => (
            <Pressable key={post.id} onPress={() => openPost(post)} style={[styles.row, { borderColor: palette.line }]}>
              <Text style={{ color: palette.orange, fontSize: 14 }}>♥</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: palette.ink }]} numberOfLines={1}>{post.title}</Text>
                <Text style={{ color: palette.muted, fontSize: 11 }}>{won(post.price)}</Text>
              </View>
            </Pressable>
          ))}
        </Section>

        <Section title="알림" palette={palette}>
          {notices.map((notice) => (
            <Pressable key={notice.id} onPress={() => openNotice(notice)} style={[styles.row, { borderColor: palette.line }]}>
              <Text style={{ fontSize: 14 }}>{noticeIcon[notice.kind]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: palette.ink }]} numberOfLines={1}>{notice.title}</Text>
                <Text style={{ color: palette.muted, fontSize: 11 }} numberOfLines={1}>{notice.body}</Text>
              </View>
              {!notice.read && <View style={[styles.unreadDot, { backgroundColor: palette.orange }]} />}
            </Pressable>
          ))}
        </Section>

        <Pressable
          onPress={() =>
            Alert.alert("로그아웃", "로그아웃 하시겠어요?", [
              { text: "취소", style: "cancel" },
              { text: "로그아웃", style: "destructive", onPress: signOut },
            ])
          }
          style={[styles.logout, { borderColor: palette.line }]}
        >
          <Text style={{ color: palette.muted, fontWeight: "600", fontSize: 13 }}>로그아웃</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryStat({ label, value, palette }: { label: string; value: number; palette: ReturnType<typeof useTheme>["palette"] }) {
  return (
    <View style={[styles.summaryStat, { backgroundColor: palette.white, borderColor: palette.line }]}>
      <Text style={[styles.summaryValue, { color: palette.ink }]}>{value}</Text>
      <Text style={{ color: palette.muted, fontSize: 9 }}>{label}</Text>
    </View>
  );
}

function Section({ title, palette, children }: { title: string; palette: ReturnType<typeof useTheme>["palette"]; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: palette.ink }]}>{title}</Text>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}

function EmptyRow({ text, palette }: { text: string; palette: ReturnType<typeof useTheme>["palette"] }) {
  return (
    <View style={[styles.row, { borderColor: palette.line, borderStyle: "dashed" }]}>
      <Text style={{ color: palette.muted, fontSize: 12 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 120, gap: 20 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 16, padding: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  nickname: { fontSize: 16, fontWeight: "800" },
  themeButton: { alignItems: "center", gap: 3, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryStat: { flex: 1, alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 12, paddingVertical: 12 },
  summaryValue: { fontSize: 16, fontWeight: "800" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  rowTitle: { fontSize: 13, fontWeight: "600" },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  logout: { alignItems: "center", borderWidth: 1, borderRadius: 12, paddingVertical: 12, marginTop: 4 },
});
