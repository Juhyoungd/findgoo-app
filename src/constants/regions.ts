export type ServiceRegion = {
  city: "대전" | "세종";
  district: string;
  dong: string;
  label: string;
  latitude: number;
  longitude: number;
};

function region(city: ServiceRegion["city"], district: string, dong: string, latitude: number, longitude: number): ServiceRegion {
  return { city, district, dong, label: `${city} ${district} ${dong}`, latitude, longitude };
}

// [지역 설정] 베타 서비스 범위: 대전·세종의 대표 구/생활권별 동 3곳씩 제공합니다.
export const serviceRegions: ServiceRegion[] = [
  region("대전", "유성구", "봉명동", 36.3547, 127.3444),
  region("대전", "유성구", "궁동", 36.3616, 127.3504),
  region("대전", "유성구", "도룡동", 36.3852, 127.3784),
  region("대전", "서구", "둔산동", 36.3505, 127.3848),
  region("대전", "서구", "탄방동", 36.3467, 127.3902),
  region("대전", "서구", "월평동", 36.3584, 127.3661),
  region("대전", "중구", "은행선화동", 36.3294, 127.4254),
  region("대전", "중구", "대흥동", 36.3225, 127.4259),
  region("대전", "중구", "오류동", 36.3250, 127.4084),
  region("세종", "중심생활권", "나성동", 36.4863, 127.2638),
  region("세종", "중심생활권", "어진동", 36.5013, 127.2625),
  region("세종", "중심생활권", "새롬동", 36.4869, 127.2528),
  region("세종", "북부생활권", "도담동", 36.5156, 127.2616),
  region("세종", "북부생활권", "아름동", 36.5121, 127.2469),
  region("세종", "북부생활권", "종촌동", 36.5049, 127.2471),
  region("세종", "남부생활권", "보람동", 36.4780, 127.2906),
  region("세종", "남부생활권", "소담동", 36.4843, 127.3001),
  region("세종", "남부생활권", "대평동", 36.4697, 127.2807),
];

export const regionLabels = serviceRegions.map((item) => item.label);

export function findNearestServiceRegion(latitude: number, longitude: number) {
  return serviceRegions.reduce((nearest, candidate) => {
    const nearestDistance = (nearest.latitude - latitude) ** 2 + (nearest.longitude - longitude) ** 2;
    const candidateDistance = (candidate.latitude - latitude) ** 2 + (candidate.longitude - longitude) ** 2;
    return candidateDistance < nearestDistance ? candidate : nearest;
  });
}
