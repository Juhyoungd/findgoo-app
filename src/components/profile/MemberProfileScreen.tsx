import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DetailScaffold } from "@/src/components/common/DetailScaffold";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { MannerMeter } from "@/src/components/profile/MannerMeter";
import { ProfileAvatar } from "@/src/components/profile/ProfileAvatar";
import { useAppData } from "@/src/state/AppDataContext";
import { useAuth } from "@/src/state/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";
import type { MemberProfile } from "@/src/types/findgoo";

// [회원 공개 프로필] 상대가 작성한 글과 거래 신뢰 정보를 채팅 밖에서도 확인합니다.
export function MemberProfileScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { profile: myProfile } = useAuth();
  const { conversations, posts } = useAppData();
  const profile: MemberProfile | undefined = userId === "me" && myProfile ? {
    id: myProfile.id,
    nickname: myProfile.nickname,
    avatarUrl: myProfile.avatarUrl,
    recentRegion: myProfile.region ?? "대전·세종",
    joinedAt: myProfile.createdAt,
    mannerStats: myProfile.mannerStats,
  } : conversations.find((item) => item.counterpartyId === userId)?.counterpartyProfile;

  if (!profile) return <DetailScaffold title="회원 프로필" eyebrow="MEMBER"><Text style={{ color: palette.muted }}>프로필 정보를 찾을 수 없어요.</Text></DetailScaffold>;
  const memberPosts = posts.filter((post) => userId === "me" ? post.mine : post.authorId === profile.id || post.author === profile.nickname);
  const joined = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(new Date(profile.joinedAt));

  return (
    <DetailScaffold title="회원 프로필" eyebrow="MEMBER">
      <View style={[styles.hero, { backgroundColor: palette.white, borderColor: palette.line }]}>
        <ProfileAvatar nickname={profile.nickname} avatarUrl={profile.avatarUrl} size={76} />
        <Text style={[styles.name, { color: palette.ink }]}>{profile.nickname}</Text>
        <Text style={[styles.meta, { color: palette.muted }]}>{profile.recentRegion} · {joined} 가입</Text>
      </View>
      <View style={[styles.manner, { backgroundColor: palette.white, borderColor: palette.line }]}><MannerMeter stats={profile.mannerStats} /></View>
      <Text style={[styles.heading, { color: palette.ink }]}>작성한 게시글 {memberPosts.length}</Text>
      {memberPosts.length ? memberPosts.map((post) => (
        <MotionPressable key={post.id} onPress={() => router.push(`/post/${post.id}`)} style={[styles.post, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <View style={[styles.typePill, { backgroundColor: post.type === "urgent" ? palette.orange : palette.blue }]}><Text style={{ color: post.type === "urgent" ? palette.white : palette.ink, fontSize: 8, fontWeight: "900" }}>{post.type === "urgent" ? "급구" : "구매"}</Text></View>
          <View style={{ flex: 1 }}><Text style={[styles.postTitle, { color: palette.ink }]} numberOfLines={1}>{post.title}</Text><Text style={[styles.postMeta, { color: palette.muted }]}>{post.region} · {post.created}</Text></View><Text style={{ color: palette.muted, fontSize: 18 }}>›</Text>
        </MotionPressable>
      )) : <View style={[styles.empty, { borderColor: palette.line }]}><Text style={{ color: palette.muted, fontSize: 10 }}>공개된 게시글이 아직 없어요.</Text></View>}
    </DetailScaffold>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", borderWidth: 1, borderRadius: 22, padding: 22 },
  name: { fontSize: 18, fontWeight: "900", marginTop: 11 },
  meta: { fontSize: 9, marginTop: 5 },
  manner: { borderWidth: 1, borderRadius: 18, padding: 16 },
  heading: { fontSize: 14, fontWeight: "900", marginTop: 4 },
  post: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 16, padding: 13 },
  typePill: { minWidth: 38, height: 26, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  postTitle: { fontSize: 12, fontWeight: "800" },
  postMeta: { fontSize: 9, marginTop: 4 },
  empty: { alignItems: "center", borderWidth: 1, borderStyle: "dashed", borderRadius: 16, padding: 25 },
});
