import type { MannerStats } from "@/src/types/findgoo";

export const BASE_MANNER_SCORE = 36.5;

// [신뢰도] 서버와 화면에서 같은 규칙을 재사용할 수 있도록 순수 함수로 분리합니다.
export function calculateMannerScore(stats: MannerStats) {
  const score =
    BASE_MANNER_SCORE
    + stats.completedTrades * 0.5
    + stats.goodMannerReviews
    + stats.successfulUrgentMissions * 0.8
    - stats.mannerReports * 2;
  return Math.min(100, Math.max(0, Math.round(score * 10) / 10));
}

export function getMannerLevel(score: number) {
  if (score >= 70) return { label: "최고예요", icon: "☀️" };
  if (score >= 50) return { label: "따뜻해요", icon: "🌤️" };
  if (score >= BASE_MANNER_SCORE) return { label: "좋아요", icon: "🌱" };
  return { label: "주의가 필요해요", icon: "🌧️" };
}

export function getMannerHighlights(stats: MannerStats) {
  return [
    { label: "시간과 약속을 잘 지켜요", count: stats.goodMannerReviews },
    { label: "거래를 깔끔하게 마쳤어요", count: stats.completedTrades },
    { label: "급구 미션을 성실히 완료했어요", count: stats.successfulUrgentMissions },
  ].filter((item) => item.count > 0);
}
