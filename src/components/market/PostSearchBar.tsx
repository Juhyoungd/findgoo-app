import { StyleSheet, Text, TextInput, View } from "react-native";
import { appIcons } from "@/src/assets/app-icons";
import { AppIcon } from "@/src/components/common/AppIcon";
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
        <View style={styles.iconWrap}><AppIcon name={appIcons.search} color={palette.muted} size={18} /></View>
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
          <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" onPress={() => onChangeQuery("")} hitSlop={8} style={styles.clearButton}>
            <AppIcon name={appIcons.close} color={palette.muted} size={12} strokeWidth={1.5} />
          </Pressable>
        )}
      </View>
      {query.trim().length > 0 && <Text style={[styles.count, { color: palette.muted }]}>검색 결과 {resultCount}개</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, paddingTop: 14 },
  bar: { minHeight: 50, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 18, paddingHorizontal: 10 },
  iconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, fontSize: 13, paddingVertical: 8 },
  clearButton: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  count: { fontSize: 10, paddingHorizontal: 2 },
});
