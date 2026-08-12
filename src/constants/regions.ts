export type ServiceCity = "대전" | "세종";

export type ServiceRegion = {
  city: ServiceCity;
  district: string;
  dong: string;
  label: string;
  latitude: number;
  longitude: number;
};

export type ServiceRegionGroup = {
  city: ServiceCity;
  district: string;
  areas: readonly string[];
  latitude: number;
  longitude: number;
};

type ReverseGeocodedAddress = {
  city?: string | null;
  district?: string | null;
  formattedAddress?: string | null;
  name?: string | null;
  region?: string | null;
  street?: string | null;
  subregion?: string | null;
};

// [활동 지역] 대전은 5개 구 아래 법정동 177곳, 세종은 동과 읍·면을 실제 주소 단위로 관리합니다.
// 그룹 중심 좌표는 GPS 역지오코딩을 사용할 수 없을 때의 안전한 대체값입니다.
export const serviceRegionGroups: readonly ServiceRegionGroup[] = [
  {
    city: "대전",
    district: "동구",
    latitude: 36.312,
    longitude: 127.454,
    areas: [
      "원동", "정동", "중동", "소제동", "신안동", "인동", "신흥동", "효동", "천동", "가오동",
      "판암동", "삼정동", "용운동", "대동", "자양동", "가양동", "용전동", "성남동", "홍도동", "삼성동",
      "추동", "비룡동", "주산동", "용계동", "마산동", "효평동", "직동", "세천동", "신상동", "신하동",
      "신촌동", "사성동", "내탑동", "오동", "주촌동", "낭월동", "대별동", "이사동", "대성동", "장척동",
      "소호동", "구도동", "삼괴동", "상소동", "하소동",
    ],
  },
  {
    city: "대전",
    district: "중구",
    latitude: 36.325,
    longitude: 127.421,
    areas: [
      "은행동", "선화동", "목동", "중촌동", "대흥동", "문창동", "석교동", "옥계동", "호동", "대사동",
      "부사동", "용두동", "오류동", "태평동", "유천동", "문화동", "산성동", "사정동", "안영동", "구완동",
      "무수동", "침산동", "목달동", "정생동", "어남동", "금동",
    ],
  },
  {
    city: "대전",
    district: "서구",
    latitude: 36.355,
    longitude: 127.383,
    areas: [
      "복수동", "도마동", "정림동", "괴곡동", "변동", "용문동", "탄방동", "둔산동", "괴정동", "가장동",
      "내동", "갈마동", "월평동", "만년동", "가수원동", "도안동", "관저동", "흑석동", "매노동", "산직동",
      "장안동", "평촌동", "오동", "우명동", "원정동", "용촌동", "봉곡동",
    ],
  },
  {
    city: "대전",
    district: "유성구",
    latitude: 36.362,
    longitude: 127.356,
    areas: [
      "성북동", "세동", "송정동", "방동", "원내동", "교촌동", "대정동", "용계동", "학하동", "계산동",
      "덕명동", "복용동", "원신흥동", "봉명동", "상대동", "구암동", "장대동", "죽동", "궁동", "어은동",
      "구성동", "갑동", "노은동", "하기동", "지족동", "수남동", "안산동", "외삼동", "반석동", "신성동",
      "가정동", "도룡동", "장동", "방현동", "화암동", "덕진동", "추목동", "자운동", "신봉동", "전민동",
      "문지동", "원촌동", "봉산동", "송강동", "금고동", "대동", "금탄동", "신동", "둔곡동", "구룡동",
      "관평동", "용산동", "탑립동",
    ],
  },
  {
    city: "대전",
    district: "대덕구",
    latitude: 36.41,
    longitude: 127.44,
    areas: [
      "오정동", "대화동", "읍내동", "연축동", "신대동", "와동", "장동", "비래동", "송촌동", "중리동",
      "법동", "신탄진동", "삼정동", "용호동", "이현동", "갈전동", "부수동", "황호동", "미호동", "석봉동",
      "덕암동", "상서동", "평촌동", "목상동", "문평동", "신일동",
    ],
  },
  {
    city: "세종",
    district: "동 지역",
    latitude: 36.5,
    longitude: 127.27,
    areas: [
      "가람동", "고운동", "나성동", "누리동", "다솜동", "다정동", "대평동", "도담동", "반곡동", "보람동",
      "산울동", "새롬동", "세종동", "소담동", "아름동", "어진동", "용호동", "종촌동", "집현동", "한별동",
      "한솔동", "합강동", "해밀동",
    ],
  },
  {
    city: "세종",
    district: "읍·면 지역",
    latitude: 36.59,
    longitude: 127.2,
    areas: ["조치원읍", "연기면", "연동면", "부강면", "금남면", "장군면", "연서면", "전의면", "전동면", "소정면"],
  },
] as const;

const coordinateOverrides: Record<string, readonly [number, number]> = {
  "대전 유성구 봉명동": [36.3547, 127.3444],
  "대전 유성구 궁동": [36.3616, 127.3504],
  "대전 유성구 도룡동": [36.3852, 127.3784],
  "대전 서구 둔산동": [36.3505, 127.3848],
  "대전 서구 탄방동": [36.3467, 127.3902],
  "대전 서구 월평동": [36.3584, 127.3661],
  "대전 중구 은행동": [36.3294, 127.4254],
  "대전 중구 대흥동": [36.3225, 127.4259],
  "대전 중구 오류동": [36.325, 127.4084],
  "세종 나성동": [36.4863, 127.2638],
  "세종 어진동": [36.5013, 127.2625],
  "세종 새롬동": [36.4869, 127.2528],
  "세종 도담동": [36.5156, 127.2616],
  "세종 아름동": [36.5121, 127.2469],
  "세종 종촌동": [36.5049, 127.2471],
  "세종 보람동": [36.478, 127.2906],
  "세종 소담동": [36.4843, 127.3001],
  "세종 대평동": [36.4697, 127.2807],
};

function getRegionLabel(city: ServiceCity, district: string, dong: string) {
  return city === "대전" ? `${city} ${district} ${dong}` : `${city} ${dong}`;
}

export const serviceRegions: ServiceRegion[] = serviceRegionGroups.flatMap((group) =>
  group.areas.map((dong) => {
    const label = getRegionLabel(group.city, group.district, dong);
    const [latitude, longitude] = coordinateOverrides[label] ?? [group.latitude, group.longitude];
    return { city: group.city, district: group.district, dong, label, latitude, longitude };
  }),
);

export const regionLabels = serviceRegions.map((item) => item.label);

export function findRegionFromAddress(address: ReverseGeocodedAddress) {
  const parts = [address.city, address.district, address.formattedAddress, address.name, address.region, address.street, address.subregion]
    .filter((part): part is string => Boolean(part))
    .map((part) => part.replace(/\s+/g, " ").trim());
  const joined = parts.join(" ");
  const city: ServiceCity | null = joined.includes("세종") ? "세종" : joined.includes("대전") ? "대전" : null;
  const candidates = (city ? serviceRegions.filter((item) => item.city === city) : serviceRegions)
    .slice()
    .sort((left, right) => right.dong.length - left.dong.length);

  return candidates.find((candidate) => {
    const escaped = candidate.dong.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return parts.includes(candidate.dong) || new RegExp(`(^|[\\s,(])${escaped}($|[\\s,)])`).test(joined);
  });
}

export function findNearestServiceRegion(latitude: number, longitude: number) {
  return serviceRegions.reduce((nearest, candidate) => {
    const nearestDistance = (nearest.latitude - latitude) ** 2 + (nearest.longitude - longitude) ** 2;
    const candidateDistance = (candidate.latitude - latitude) ** 2 + (candidate.longitude - longitude) ** 2;
    return candidateDistance < nearestDistance ? candidate : nearest;
  });
}
