import type { MemberProfile } from "@/src/types/findgoo";

export const demoMyProfile: MemberProfile & { name: string; phone: string } = {
  id: "demo-me",
  name: "김찾구",
  phone: "01012345678",
  nickname: "동네탐험가",
  avatarUrl: "https://i.pravatar.cc/240?img=12",
  recentRegion: "대전 유성구 봉명동",
  joinedAt: "2025-11-18T09:00:00.000Z",
  mannerStats: { completedTrades: 8, goodMannerReviews: 5, successfulUrgentMissions: 3, mannerReports: 0 },
};

export const demoMemberProfiles: Record<string, MemberProfile> = {
  "demo-seller": {
    id: "demo-seller",
    nickname: "레몬소다",
    avatarUrl: "https://i.pravatar.cc/240?img=32",
    recentRegion: "대전 유성구 도룡동",
    joinedAt: "2024-04-09T09:00:00.000Z",
    mannerStats: { completedTrades: 41, goodMannerReviews: 25, successfulUrgentMissions: 7, mannerReports: 0 },
  },
  "demo-buyer": {
    id: "demo-buyer",
    nickname: "오후두시",
    avatarUrl: "https://i.pravatar.cc/240?img=47",
    recentRegion: "대전 서구 둔산동",
    joinedAt: "2025-01-22T09:00:00.000Z",
    mannerStats: { completedTrades: 29, goodMannerReviews: 18, successfulUrgentMissions: 11, mannerReports: 1 },
  },
};

export function createFallbackMemberProfile(id: string, nickname = "찾구 회원"): MemberProfile {
  return {
    id,
    nickname,
    avatarUrl: null,
    recentRegion: "대전·세종",
    joinedAt: new Date().toISOString(),
    mannerStats: { completedTrades: 0, goodMannerReviews: 0, successfulUrgentMissions: 0, mannerReports: 0 },
  };
}
