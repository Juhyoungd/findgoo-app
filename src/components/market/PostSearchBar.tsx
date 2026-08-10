import { StyleSheet, Text, TextInput, View } from "react-native";
import { MotionPressable as Pressable } from "@/src/components/common/MotionPressable";
import { useTheme } from "@/src/theme/ThemeContext";

type PostSearchBarProps = {
  query: string;
  onChangeQuery: (value: string) => void;
  placeholder: string;
  resultCount: number;
};

// [검색] 구매글·급구 목록이 함께 사용하는 실시간 키워드 검색창
export function PostSearchBar({ query, onChangeQuery, placeholder, resultCount }: PostSearchBarProps) {
  const { palette } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.bar, { backgroundColor: palette.white, borderColor: query ? palette.lime : palette.line }]}>
        <Text style={[styles.icon, { color: palette.lime }]}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder={placeholder}
          placeholderTextColor={palette.muted}
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.input, { color: palette.ink }]}
        />
        {query.length > 0 && (
          <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" onPress={() => onChangeQuery("")} hitSlop={8}>
            <Text style={[styles.clear, { color: palette.muted }]}>×</Text>
          </Pressable>
        )}
      </View>
      {query.trim().length > 0 && <Text style={[styles.count, { color: palette.muted }]}>검색 결과 {resultCount}개</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, paddingTop: 14 },
  bar: { height: 48, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14 },
  icon: { fontSize: 17, fontWeight: "800" },
  input: { flex: 1, fontSize: 13, paddingVertical: 8 },
  clear: { fontSize: 18, lineHeight: 20 },
  count: { fontSize: 10, paddingHorizontal: 2 },
});
