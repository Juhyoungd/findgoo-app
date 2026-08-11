import type { AppNotice, Conversation, Offer, Post, UserReport } from "@/src/types/findgoo";
import { regionLabels } from "@/src/constants/regions";

// [검색]
export const categories = ["전체", "디지털", "가구·생활", "명품·패션", "취미", "티켓·굿즈", "식품", "반려동물", "사람·일손", "심부름", "전문 도움", "공간·대여"];
export const regions = regionLabels;
export const sortOptions = [
  { value: "latest", label: "최신순" },
  { value: "popular", label: "인기순" },
  { value: "price-low", label: "낮은 가격순" },
  { value: "price-high", label: "높은 가격순" },
] as const;

// [구매글] + [급구] 예시글
const rawSeedPosts: Post[] = [
  { id:"my-queue",type:"urgent",category:"심부름",title:"오늘 저녁 한정판 굿즈 수령 도와주실 분",description:"예약 확인서를 보내드리면 상품을 수령해 봉명동에서 전달해 주세요. 예상 소요 시간은 40분입니다.",price:22000,region:"성수동1가",deadline:"오늘 19:30",author:"베타사용자",manner:36.5,views:28,offerCount:0,created:"12분 전",status:"open",mine:true },
  { id:"my-watch",type:"buy",category:"명품·패션",title:"빈티지 오메가 드빌 여성 시계 구해요",description:"정품 확인 가능한 구성과 최근 점검 내역이 있으면 좋겠습니다. 생활 기스는 괜찮아요.",price:680000,region:"한남동",author:"베타사용자",manner:36.5,views:49,offerCount:2,created:"3시간 전",status:"reserved",mine:true },
  { id:"buy-ipad",type:"buy",category:"디지털",title:"아이패드 미니 6세대 셀룰러 구해요",description:"깨끗하게 사용한 제품을 찾습니다. 색상은 상관없고 배터리 효율 85% 이상이면 좋아요.",price:420000,region:"성수동1가",author:"레몬소다",manner:91.2,views:184,offerCount:4,created:"8분 전",status:"open" },
  { id:"buy-chair",type:"buy",category:"가구·생활",title:"이케아 단종 원목 협탁을 찾고 있어요",description:"구형 모델을 찾습니다. 생활 흠집은 괜찮고 대전·세종 직거래를 희망해요.",price:80000,region:"망원1동",author:"잘찾는사람",manner:86.4,views:72,offerCount:1,created:"34분 전",status:"open" },
  { id:"buy-camera",type:"buy",category:"취미",title:"입문용 필름카메라와 50mm 렌즈 구해요",description:"노출계가 정상 작동하면 외관 사용감은 괜찮습니다. 테스트 필름 결과가 있으면 좋아요.",price:170000,region:"연남동",author:"주말산책",manner:88.7,views:61,offerCount:2,created:"1시간 전",status:"open" },
  { id:"buy-toy",type:"buy",category:"취미",title:"단종된 기차 블록 세트 찾아요",description:"박스는 없어도 되고 부품 누락만 없으면 됩니다. 사진 확인 후 택배도 가능해요.",price:65000,region:"잠실본동",author:"블록수집가",manner:94.1,views:105,offerCount:3,created:"2시간 전",status:"open" },
  { id:"buy-bag",type:"buy",category:"명품·패션",title:"셀린느 트리오페 틴백 탄 컬러 찾아요",description:"구매 영수증이나 정품 검수 내역이 있는 제품을 찾습니다. 직거래 우선이에요.",price:2100000,region:"압구정동",author:"모카클로젯",manner:96.8,views:342,offerCount:6,created:"18분 전",status:"open" },
  { id:"buy-ticket",type:"buy",category:"티켓·굿즈",title:"이번 주 재즈 페스티벌 토요일 2장 구해요",description:"정가 양도만 찾고 있으며 예매 내역 확인 후 안전하게 거래하고 싶어요.",price:240000,region:"서교동",author:"밤의재즈",manner:92.1,views:128,offerCount:3,created:"52분 전",status:"open" },
  { id:"buy-desk",type:"buy",category:"가구·생활",title:"1200mm 화이트 높이조절 책상 구합니다",description:"모터 소음이 적고 상판 찍힘이 심하지 않은 제품이면 좋겠습니다.",price:190000,region:"판교동",author:"집중모드",manner:89.5,views:44,offerCount:1,created:"4시간 전",status:"open" },
  { id:"buy-wine",type:"buy",category:"식품",title:"제주 소규모 로스터리 원두 대신 구매 부탁",description:"온라인 품절 원두 2봉을 매장에서 구해 택배로 보내주실 수 있는 분을 찾습니다.",price:48000,region:"여의동",author:"오전한잔",manner:90.7,views:80,offerCount:2,created:"5시간 전",status:"open" },
  { id:"buy-keyboard",type:"buy",category:"디지털",title:"저소음 커스텀 키보드 완제품 찾아요",description:"사무실에서 쓸 75배열 제품을 찾습니다. 타건 영상이 있으면 함께 보내주세요.",price:230000,region:"역삼1동",author:"키캡수집가",manner:95.0,views:156,offerCount:5,created:"6시간 전",status:"open" },
  { id:"buy-rental",type:"buy",category:"공간·대여",title:"대전 제품 촬영 가능한 주방 스튜디오 찾아요",description:"4인 촬영팀이 반나절 사용할 자연광 주방 공간을 찾고 있습니다.",price:350000,region:"성수동2가",author:"브랜드메이커",manner:93.3,views:67,offerCount:2,created:"어제",status:"open" },
  { id:"buy-designer",type:"buy",category:"전문 도움",title:"작은 카페 메뉴판 디자인해주실 분",description:"A3 메뉴판 두 장과 인스타용 이미지가 필요합니다. 포트폴리오를 함께 보여주세요.",price:180000,region:"망원1동",author:"초록잔",manner:87.9,views:103,offerCount:8,created:"어제",status:"open" },
  { id:"urgent-line",type:"urgent",category:"심부름",title:"오늘 6시 둔산 팝업 대기줄 확인해주실 분",description:"대기 인원과 현장 재고를 확인해 주세요. 사진 한 장과 직원 확인까지 부탁드려요.",price:18000,region:"성수동2가",deadline:"오늘 18:00",author:"오후두시",manner:93.6,views:96,offerCount:2,created:"5분 전",status:"open" },
  { id:"urgent-shoot",type:"urgent",category:"사람·일손",title:"내일 오전 촬영 보조 2시간 급구",description:"간단한 장비 이동과 현장 정리를 도와주실 분을 찾습니다. 무거운 장비는 없어요.",price:50000,region:"연남동",deadline:"내일 09:00",author:"스튜디오온",manner:89.9,views:211,offerCount:7,created:"21분 전",status:"open" },
  { id:"urgent-gift",type:"urgent",category:"심부름",title:"백화점 선물 픽업 후 퀵 전달 부탁드려요",description:"예약 상품을 찾아 인근 사무실 로비에 전달해 주시면 됩니다. 영수증 확인 필수예요.",price:25000,region:"여의동",deadline:"오늘 16:30",author:"구름라떼",manner:96.2,views:143,offerCount:5,created:"42분 전",status:"open" },
  { id:"urgent-dog",type:"urgent",category:"반려동물",title:"저녁 강아지 산책 40분 도와주실 분",description:"순한 중형견이고 산책 용품은 준비돼 있어요. 반려견 경험이 있는 분이면 좋겠습니다.",price:20000,region:"역삼1동",deadline:"오늘 20:00",author:"보리누나",manner:97.5,views:88,offerCount:4,created:"1시간 전",status:"open" },
  { id:"urgent-luxury",type:"urgent",category:"명품·패션",title:"오픈런 구매 대행 가능하신 분 급구",description:"오전 9시부터 2시간 대기 후 지정 상품 1개를 구매해 주세요. 실비는 별도 정산합니다.",price:85000,region:"압구정동",deadline:"내일 09:00",author:"컬렉터K",manner:94.8,views:402,offerCount:11,created:"7분 전",status:"open" },
  { id:"urgent-moving",type:"urgent",category:"사람·일손",title:"책장 이동 도와주실 두 분 구해요",description:"같은 건물 3층에서 1층으로 책장 두 개를 옮깁니다. 엘리베이터가 있어요.",price:70000,region:"한남동",deadline:"토요일 14:00",author:"정리하는날",manner:91.7,views:119,offerCount:4,created:"29분 전",status:"open" },
  { id:"urgent-translation",type:"urgent",category:"전문 도움",title:"일본어 현장 통역 3시간 급하게 구합니다",description:"패션 쇼룸 바이어 미팅에서 순차 통역이 필요합니다. 유사업무 경험자를 선호해요.",price:180000,region:"성수동1가",deadline:"내일 13:00",author:"아틀리에대전",manner:98.1,views:277,offerCount:9,created:"31분 전",status:"open" },
  { id:"urgent-seat",type:"urgent",category:"심부름",title:"공연장 현장 수령 티켓 대신 받아주세요",description:"신분증 사본과 예매 내역을 전달드리며 수령 후 바로 인근 카페에서 받을게요.",price:30000,region:"잠실본동",deadline:"오늘 17:30",author:"퇴근직전",manner:90.2,views:135,offerCount:3,created:"47분 전",status:"open" },
  { id:"urgent-cat",type:"urgent",category:"반려동물",title:"출장 중 고양이 급식과 화장실 정리",description:"이틀 동안 하루 한 번 방문해 급식과 사진 인증을 부탁드립니다.",price:60000,region:"서교동",deadline:"금요일 19:00",author:"호두집사",manner:99.0,views:74,offerCount:6,created:"2시간 전",status:"open" },
  { id:"urgent-cake",type:"urgent",category:"식품",title:"예약 케이크 픽업 후 냉장 보관 부탁",description:"오후 4시 픽업 후 7시까지 안전하게 보관해 주실 분을 구합니다.",price:28000,region:"연남동",deadline:"오늘 16:00",author:"기념일준비",manner:92.6,views:57,offerCount:2,created:"2시간 전",status:"open" },
  { id:"urgent-test",type:"urgent",category:"전문 도움",title:"모바일 앱 사용성 테스트 참가자 5명",description:"30분 화상 인터뷰와 화면 테스트입니다. 중고거래 앱 사용 경험자를 찾습니다.",price:35000,region:"판교동",deadline:"이번 주",author:"리서치팀",manner:96.4,views:189,offerCount:14,created:"3시간 전",status:"open" },
  { id:"urgent-photo",type:"urgent",category:"사람·일손",title:"반려견 행사 사진 촬영 1시간",description:"야외 행사에서 자연스러운 스냅 사진 30장 이상을 촬영해 주세요.",price:120000,region:"여의동",deadline:"일요일 11:00",author:"위드퍼피",manner:95.5,views:98,offerCount:5,created:"4시간 전",status:"reserved" },
  { id:"urgent-room",type:"urgent",category:"공간·대여",title:"오늘 밤 4인 회의실 두 시간 급구",description:"모니터와 화이트보드가 있는 조용한 회의실을 찾습니다.",price:50000,region:"역삼1동",deadline:"오늘 21:00",author:"프로젝트나인",manner:88.8,views:123,offerCount:4,created:"5시간 전",status:"open" },
  { id:"urgent-sold",type:"urgent",category:"심부름",title:"공항 서류 전달 미션",description:"봉인된 계약 서류를 지정 카운터에 전달하고 수령 확인 사진을 보내주세요.",price:45000,region:"여의동",deadline:"마감",author:"퀵브릿지",manner:97.2,views:225,offerCount:8,created:"어제",status:"closed" },
  { id:"my-sejong-cake",type:"urgent",category:"심부름",title:"세종 나성동 예약 케이크 픽업 부탁해요",description:"오후 6시 전에 픽업해 보람동 아파트 로비까지 전달해주세요.",price:27000,region:"나성동",deadline:"오늘 18:00",author:"베타사용자",manner:36.5,views:36,offerCount:3,created:"22분 전",status:"open",mine:true },
  { id:"my-daejeon-console",type:"buy",category:"디지털",title:"닌텐도 스위치 OLED 화이트 구해요",description:"대전 직거래로 상태 확인 후 구매하고 싶어요. 박스와 구성품이 있으면 좋습니다.",price:260000,region:"둔산동",author:"베타사용자",manner:36.5,views:81,offerCount:4,created:"1시간 전",status:"open",mine:true },
  { id:"urgent-sejong-study",type:"urgent",category:"공간·대여",title:"세종 어진동 6인 회의실 오늘 급구",description:"모니터와 화이트보드가 있는 조용한 공간을 두 시간 이용하려고 합니다.",price:48000,region:"어진동",deadline:"오늘 20:00",author:"프로젝트곰",manner:93.8,views:76,offerCount:5,created:"17분 전",status:"open" },
  { id:"buy-daejeon-lens",type:"buy",category:"디지털",title:"소니 35mm 단렌즈 대전 직거래로 찾아요",description:"외관 사용감은 괜찮고 곰팡이나 포커스 이상이 없는 제품을 구합니다.",price:390000,region:"궁동",author:"필름산책",manner:95.2,views:112,offerCount:3,created:"43분 전",status:"open" },
];

// [대전·세종 샘플] 기존의 다양한 예시 내용은 유지하되 베타 노출 지역은 지원 지역 안에서 순환합니다.
export const seedPosts: Post[] = rawSeedPosts.map((post, index) => ({ ...post, region: regionLabels[index % regionLabels.length] }));

// [채팅] Supabase 환경변수가 없는 로컬 베타 데모에서만 쓰는 대화방 목록
export const seedConversations: Conversation[] = [
  {
    id: "conversation-demo-1",
    postId: "buy-ipad",
    postTitle: "아이패드 미니 6세대 셀룰러 구해요",
    postPrice: 420000,
    sellerId: "demo-seller",
    buyerId: "demo-me",
    counterpartyId: "demo-seller",
    counterpartyName: "레몬소다",
    lastMessage: "네, 2번 출구 앞에서 뵐게요.",
    lastMessageAt: new Date().toISOString(),
  },
  {
    id: "conversation-demo-2",
    postId: "urgent-line",
    postTitle: "오늘 6시 둔산 팝업 대기줄 확인해주실 분",
    postPrice: 18000,
    sellerId: "demo-me",
    buyerId: "demo-buyer",
    counterpartyId: "demo-buyer",
    counterpartyName: "오후두시",
    lastMessage: "제안 수락했습니다. 현장 도착하면 바로 연락드릴게요.",
    lastMessageAt: new Date().toISOString(),
  },
];

// [알림]
export const seedNotices: AppNotice[] = [
  { id:"notice-offer",kind:"offer",title:"새 지원자가 있어요",body:"동네러너님이 급구 글에 24,000원을 제안했어요.",time:"12분 전",read:false,postId:"my-queue" },
  { id:"notice-keyword",kind:"keyword",title:"'아이패드' 새 글",body:"대전 도룡동에 조건과 맞는 구매글이 올라왔어요.",time:"28분 전",read:false,postId:"buy-ipad" },
  { id:"notice-urgent",kind:"urgent",title:"내 지역 마감 임박 급구",body:"대전 궁동 팝업 대기줄 확인 미션이 곧 마감돼요.",time:"35분 전",read:true,postId:"urgent-line" },
  { id:"notice-chat",kind:"chat",title:"새 채팅 메시지",body:"레몬소다님이 거래 장소를 제안했어요.",time:"47분 전",read:false,postId:"buy-ipad" },
  { id:"notice-trade",kind:"trade",title:"거래 일정 확인",body:"오늘 오후 7시 봉명동 거래 일정이 있어요.",time:"1시간 전",read:false,postId:"buy-ipad" },
  { id:"notice-favorite",kind:"favorite",title:"찜한 급구 마감 임박",body:"강아지 산책 급구가 2시간 뒤 마감돼요.",time:"2시간 전",read:true,postId:"urgent-dog" },
  { id:"notice-sejong",kind:"keyword",title:"'세종 케이크' 새 글",body:"나성동에서 관심 키워드와 일치하는 급구가 올라왔어요.",time:"3시간 전",read:false,postId:"my-sejong-cake" },
  { id:"notice-system",kind:"system",title:"대전·세종 지역 설정 안내",body:"활동 지역을 최대 3곳까지 선택할 수 있어요.",time:"어제",read:true },
  { id:"notice-offer-accepted",kind:"offer",title:"보낸 제안이 수락됐어요",body:"팝업 대기줄 확인 미션의 1:1 채팅이 열렸어요.",time:"어제",read:true,postId:"urgent-line" },
  { id:"notice-review",kind:"trade",title:"거래 후기를 남겨주세요",body:"완료한 대리구매 거래의 후기를 작성하면 신뢰도에 반영돼요.",time:"2일 전",read:true,postId:"urgent-gift" },
];

// [판매 제안] 홈의 받은 제안·보낸 제안과 상세 화면에서 함께 사용하는 예시 데이터
export const seedOffers: Offer[] = [
  { id:"offer-in-watch",postId:"my-watch",nickname:"시계수집가",price:650000,message:"정품 보증서와 최근 오버홀 내역이 있습니다. 오늘 세종 나성동 직거래 가능해요.",direction:"incoming",status:"pending",created:"18분 전" },
  { id:"offer-in-queue",postId:"my-queue",nickname:"동네러너",price:24000,message:"매장 위치를 잘 알고 있어요. 수령 사진과 영수증까지 바로 보내드릴게요.",direction:"incoming",status:"pending",created:"32분 전" },
  { id:"offer-out-ipad",postId:"buy-ipad",nickname:"레몬소다",price:400000,message:"오늘 저녁 대전 도룡동에서 제품 상태를 확인하고 거래하고 싶습니다.",direction:"outgoing",status:"pending",created:"1시간 전" },
  { id:"offer-out-line",postId:"urgent-line",nickname:"오후두시",price:18000,message:"현장 도착 후 대기 인원과 재고를 사진으로 전달하겠습니다.",direction:"outgoing",status:"accepted",created:"2시간 전" },
  { id:"offer-in-console",postId:"my-daejeon-console",nickname:"둔산게임샵",price:250000,message:"박스와 기본 구성품이 있고 오늘 둔산동에서 확인 가능합니다.",direction:"incoming",status:"pending",created:"2시간 전" },
  { id:"offer-in-cake",postId:"my-sejong-cake",nickname:"나성산책",price:27000,message:"매장과 가까워 시간 안에 픽업과 사진 인증 가능합니다.",direction:"incoming",status:"pending",created:"3시간 전" },
  { id:"offer-out-dog",postId:"urgent-dog",nickname:"보리누나",price:20000,message:"중형견 산책 경험이 있고 저녁 시간에 맞춰 갈 수 있어요.",direction:"outgoing",status:"rejected",created:"어제" },
  { id:"offer-out-lens",postId:"buy-daejeon-lens",nickname:"필름산책",price:370000,message:"궁동에서 제품 테스트 후 바로 거래하고 싶습니다.",direction:"outgoing",status:"pending",created:"어제" },
];

// [신고] 채팅 신고 접수와 관리자 신고 관리 화면을 연결하는 예시 데이터
export const seedReports: UserReport[] = [
  { id:"report-demo",postId:"buy-ipad",reporter:"테스트회원",reportedUser:"거래상대",reason:"거래 불이행",detail:"약속 장소에 나타나지 않았고 이후 연락이 되지 않습니다.",created:"어제",status:"reviewing" },
  { id:"report-payment",postId:"urgent-luxury",reporter:"컬렉터K",reportedUser:"대리구매99",reason:"사기 의심",detail:"플랫폼 채팅을 거부하고 개인 계좌로 전체 금액 선입금을 반복해서 요구했습니다.",created:"35분 전",status:"pending" },
  { id:"report-abuse",postId:"urgent-dog",reporter:"보리누나",reportedUser:"산책고수",reason:"욕설·비방",detail:"제안을 거절한 뒤 채팅에서 반복적으로 비방 메시지를 보냈습니다.",created:"3시간 전",status:"pending" },
  { id:"report-item",postId:"buy-bag",reporter:"모카클로젯",reportedUser:"정품만취급",reason:"부적절한 상품",detail:"정품 검수 자료와 실제 상품의 시리얼 정보가 달라 거래를 중단했습니다.",created:"3일 전",status:"resolved" },
];
