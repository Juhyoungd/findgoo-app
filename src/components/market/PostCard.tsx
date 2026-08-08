import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";
import type { Post } from "@/src/types/findgoo";

type PostCardProps = {
  post: Post;
  saved: boolean;
  totalOfferCount: number;
  onOpen: (post: Post) => void;
  onToggleSaved: (post: Post) => void;
};

const statusLabel: Record<Post["status"], string> = { open: "거래 가능", reserved: "진행 중", closed: "마감" };

// [구매글] + [급구] 목록에 나오는 카드 한 장
export function PostCard({ post, saved, totalOfferCount, onOpen, onToggleSaved }: PostCardProps) {
  const { palette } = useTheme();
  const isUrgent = post.type === "urgent";

  return (
    <Pressable onPress={() => onOpen(post)} style={[styles.card, { backgroundColor: palette.white, borderColor: palette.line }, isUrgent && { borderLeftColor: palette.orange, borderLeftWidth: 3 }]}>
      <View style={styles.head}>
        <View style={styles.badgeRow}>
          <Text style={[styles.badge, { backgroundColor: isUrgent ? `${palette.orange}22` : palette.blue, color: isUrgent ? palette.orange : palette.lime }]}>{isUrgent ? "급구" : "구매해요"}</Text>
          <Text style={[styles.badge, { backgroundColor: palette.paper, color: palette.muted }]}>{post.category}</Text>
          <Text style={[styles.badge, { backgroundColor: palette.paper, color: palette.muted }]}>{statusLabel[post.status]}</Text>
        </View>
        <Pressable onPress={() => onToggleSaved(post)} hitSlop={8}>
          <Text style={{ fontSize: 18, color: saved ? palette.orange : palette.muted }}>{saved ? "♥" : "♡"}</Text>
        </Pressable>
      </View>
      <Text style={[styles.title, { color: palette.ink }]} numberOfLines={1}>{post.title}</Text>
      <Text style={[styles.description, { color: palette.muted }]} numberOfLines={2}>{post.description}</Text>
      <View style={styles.infoRow}>
        <Text style={[styles.infoText, { color: palette.muted }]}>⌖ {post.region} · {post.created}</Text>
        {post.deadline && <Text style={[styles.deadline, { color: palette.orange }]}>{post.deadline}</Text>}
      </View>
      <View style={[styles.bottomRow, { borderTopColor: palette.line }]}>
        <View>
          <Text style={[styles.priceLabel, { color: palette.muted }]}>{isUrgent ? "지원 금액" : "희망 가격"}</Text>
          <Text style={[styles.priceValue, { color: palette.ink }]}>{won(post.price)}</Text>
        </View>
        <View style={[styles.offerBubble, { backgroundColor: palette.paper }]}>
          <Text style={{ color: palette.lime, fontWeight: "700" }}>{totalOfferCount}</Text>
          <Text style={{ color: palette.muted, fontSize: 11 }}>{isUrgent ? "명 지원" : "개의 제안"}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 8 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badgeRow: { flexDirection: "row", gap: 6 },
  badge: { fontSize: 10, fontWeight: "700", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, overflow: "hidden" },
  title: { fontSize: 15, fontWeight: "700" },
  description: { fontSize: 12, lineHeight: 17 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 10 },
  deadline: { fontSize: 10, fontWeight: "700" },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, paddingTop: 10, marginTop: 2 },
  priceLabel: { fontSize: 9 },
  priceValue: { fontSize: 15, fontWeight: "800", marginTop: 2 },
  offerBubble: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
});
