// 과잉반응 대비 데이터 + 조회 로직.
// 오늘 날씨·뉴스·여행·일정 신호를 받아 미리 할 일, 구매 추천, 대피·쉼터 장소를 돌려줌.
// 행동요령은 행정안전부 국민재난안전포털 국민행동요령, 외교부 해외안전여행, 질병관리청 자료 요약.
// 배포 전 공식 자료와 대조 검수 필요.

// vooy에서 쓸 수 있는 서비스. false 는 사용자가 연결해야 동작.
export const VOOY_SERVICES = {
  '네이버 항공권': true, '다나와 가격비교': true, '다이소': true, '당근': true,
  '배송 추적': true, '카카오맵': true, '한국 날씨': true, 'Buyee': true,
  'Web Search': true, '마이리얼트립': true,
  '요기요': false, '모두의주차장': false, '여기어때': false, 'Swing Taxi': false,
  '구글 캘린더': false, '구글 태스크': false,
};

const h = (service, action) => ({ service, action });

// priority: 1 = 생명·재산 직결, 2 = 건강·불편 큼, 3 = 생활 불편
// when: 이 신호로 판단할 기준 (vooy가 날씨·뉴스를 보고 고를 때 참고)
// places: 카카오맵 검색어. location 이 있으면 앞에 붙임
// {목적지} 는 destination 으로 치환
export const SIGNALS = {
  // ── 날씨 (한국 날씨) ──
  heatwave: {
    peril: '열사병은 의식을 잃고 119 실려 가는 경우도 있어요',
    label: '폭염', group: 'weather', priority: 2,
    when: '오늘~3일 뒤 최고기온 30℃ 이상 예보 또는 폭염주의보·경보',
    prepare: [
      '목마르기 전에 물 자주 마시기',
      '낮 12~17시 야외활동 줄이기',
      '혼자 사는 어르신·노약자 안부 연락',
      '차 안에 아이·반려동물 절대 두지 않기',
    ],
    avoid: ['한낮 야외 작업·운동', '더울 때 음주'],
    buy: [h('다이소', '휴대용 선풍기·쿨토시·양산 검색 및 가까운 매장 재고 확인')],
    places: ['무더위쉼터'],
    check: [h('요기요', '한낮 외출 대신 배달 음식')],
  },
  cold_wave: {
    peril: '저체온증·동파·빙판 낙상, 밤에 술 마시고 걸으면 진짜 위험해요',
    label: '한파·영하·기온 급강하', group: 'weather', priority: 2,
    when: '오늘~3일 뒤 최저기온 0℃ 이하(첫 영하 포함), 하루 새 10℃ 이상 급강하, 또는 한파주의보·경보',
    prepare: [
      '수도계량기함을 헌 옷·보온재로 채워 동파 막기',
      '밤에는 수도꼭지를 조금 틀어 물이 흐르게 두기',
      '외출 시 모자·장갑·목도리, 내복',
      '보일러는 끄지 말고 외출 모드',
    ],
    avoid: ['전열기구 옆 빨래 말리기', '술 마신 뒤 걸어서 귀가'],
    buy: [
      h('다이소', '핫팩·수도계량기 보온재 검색 및 매장 재고 확인'),
      h('다나와 가격비교', '전기요·온수매트 최저가'),
    ],
    places: ['한파쉼터'],
    check: [],
  },
  heavy_rain: {
    peril: '지하차도·반지하 침수는 몇 분 만에 목숨을 위협해요',
    label: '호우', group: 'weather', priority: 1,
    when: '호우주의보·경보 또는 시간당 30mm 이상 비 예보',
    prepare: [
      '집 앞 배수구·하수구 덮개 위 쓰레기 치우기',
      '반지하 거주면 물막이판 설치, 침수 시 바로 나갈 길 확인',
      '지하주차장 차량을 지상·고지대로 옮기기',
      '휴대폰·보조배터리 완충',
    ],
    avoid: ['지하차도·하천 산책로·계곡', '침수된 도로 차량 통과'],
    buy: [
      h('다이소', '우비·장화·방수팩 검색 및 매장 재고 확인'),
      h('다나와 가격비교', '차수판(물막이판)·모래주머니 최저가'),
    ],
    places: ['임시주거시설 대피소'],
    check: [
      h('Web Search', '오늘 재난문자·도로 통제 구간 확인'),
      h('모두의주차장', '차량 옮길 지상·고지대 주차장 검색'),
    ],
  },
  typhoon: {
    peril: '간판·유리창 파편, 해안가 높은 파도에 사망 사고가 나요',
    label: '태풍', group: 'weather', priority: 1,
    when: '한반도 어디든(제주·남해안 포함) 태풍 영향 또는 3일 안에 접근 예보. 내 지역이 아니어도 해당',
    prepare: [
      '창문은 잠금장치로 창틀에 단단히 고정 (테이프는 효과 작음)',
      '베란다·옥상·마당의 날아갈 물건 치우기',
      '물·비상식량 3일치, 손전등, 보조배터리 준비',
      '태풍 통과 중엔 외출하지 않기',
    ],
    avoid: ['해안가·방파제 구경', '공사장·간판 근처 지나기'],
    buy: [
      h('다이소', '손전등·건전지 검색 및 매장 재고 확인'),
      h('다나와 가격비교', '대용량 보조배터리·충전식 랜턴 최저가'),
    ],
    places: ['임시주거시설 대피소'],
    check: [
      h('네이버 항공권', '예약한 항공편 결항·대체편 확인'),
      h('마이리얼트립', '태풍 기간 여행 일정 변경·취소 규정 확인'),
    ],
  },
  heavy_snow: {
    peril: '빙판 낙상·교통사고, 지붕 붕괴 위험이 있어요',
    label: '대설·빙판', group: 'weather', priority: 2,
    when: '대설주의보·경보 또는 영하 날씨에 눈·비 예보',
    prepare: [
      '내 집·가게 앞 눈 치우기',
      '자가용 대신 대중교통, 운전하면 스노체인',
      '비닐하우스·약한 지붕은 쌓인 눈 미리 치우기',
      '밑창 미끄럽지 않은 신발',
    ],
    avoid: ['급출발·급제동', '주머니에 손 넣고 걷기'],
    buy: [
      h('다이소', '아이젠·제설삽·염화칼슘 검색 및 매장 재고 확인'),
      h('다나와 가격비교', '스노체인·스프레이 체인 최저가'),
    ],
    places: [],
    check: [],
  },
  fine_dust: {
    label: '미세먼지·황사', group: 'weather', priority: 3,
    when: '미세먼지·초미세먼지 "나쁨" 이상 또는 황사 예보',
    prepare: [
      '외출 시 KF80 이상 마스크',
      '창문 닫고, 요리할 때만 짧게 환기',
      '외출 뒤 손·얼굴 씻기, 물 많이 마시기',
      '공기청정기 필터 상태 확인',
    ],
    avoid: ['야외 운동'],
    buy: [
      h('다이소', 'KF94 마스크 검색 및 매장 재고 확인'),
      h('다나와 가격비교', '공기청정기 교체 필터 최저가'),
    ],
    places: [],
    check: [],
  },
  temp_gap: {
    label: '큰 일교차', group: 'weather', priority: 3,
    when: '낮과 밤 기온 차 10℃ 이상',
    prepare: [
      '얇은 겉옷 하나 가방에 넣기 (저녁 귀가용)',
      '밤에 창문 닫고 자기',
      '목 칼칼하면 따뜻한 물, 손 씻기 (감기 시즌)',
    ],
    avoid: ['낮 기온만 보고 반팔로 나가기'],
    buy: [h('다이소', '경량 패딩조끼·목 워머·텀블러 검색')],
    places: [],
    check: [],
  },
  strong_wind: {
    peril: '날아오는 간판·공사장 자재에 크게 다칠 수 있어요',
    label: '강풍', group: 'weather', priority: 2,
    when: '오늘~3일 뒤 강풍 예보(풍속 9m/s 이상) 또는 강풍주의보·경보',
    prepare: [
      '베란다·창가 화분, 빨래 건조대 안으로',
      '간판·공사장·가로수 옆 피해서 걷기',
      '우산은 뒤집히니 우비가 나음',
      '창문 잠금 확인',
    ],
    avoid: ['고층 건물 사이 빌딩풍 구간 오래 걷기'],
    buy: [h('다이소', '우비·모자 고정끈 검색')],
    places: [],
    check: [],
  },
  dry_wildfire: {
    peril: '불씨 하나가 산불이 되면 대피 시간이 몇 분뿐이에요',
    label: '건조·산불', group: 'weather', priority: 1,
    when: '건조주의보·경보 또는 산불 뉴스',
    prepare: [
      '산에 갈 계획이면 입산 통제 구역 확인',
      '산 근처에서 불씨(담배·취사·쓰레기 소각) 금지',
      '산불 나면 바람 반대 방향, 이미 탄 곳이나 넓은 공터로 대피',
      '산 인접 주택은 대피 경로와 챙길 물건 미리 정하기',
    ],
    avoid: ['산림 인접 지역 쓰레기 태우기'],
    buy: [h('다나와 가격비교', '가정용 소화기 최저가')],
    places: ['대피소'],
    check: [h('Web Search', '내 지역 산불·입산 통제 확인')],
  },

  // ── 뉴스 (Web Search) ──
  earthquake: {
    peril: '본진보다 이후 낙하물·가스 누출·여진이 더 위험해요',
    label: '지진', group: 'news', priority: 1,
    when: '국내 지진 발생·여진 뉴스, 또는 여행지(일본 등) 지진 뉴스',
    prepare: [
      '흔들리면 탁자 아래 머리 보호, 멈추면 계단으로 넓은 곳 대피',
      '높은 곳의 무거운 물건 내리고 책장·장롱 고정',
      '생존배낭 점검 (물·식량·손전등·약·호루라기·현금)',
      '가족과 만날 장소 정하기',
    ],
    avoid: ['흔들리는 중 밖으로 뛰어나가기', '엘리베이터'],
    buy: [
      h('다이소', '생존배낭 구성품(손전등·호루라기·비상담요) 검색'),
      h('Buyee', '일본 방재용품 세트 검색'),
      h('다나와 가격비교', '가구 전도 방지 고정장치 최저가'),
    ],
    places: ['지진 옥외대피장소'],
    check: [h('Web Search', '지진 규모·여진·피해 지역 확인')],
  },
  civil_defense: {
    peril: '대피소 위치를 모르면 경보 후 몇 분 안에 대피 못 해요. 전쟁은 준비한 사람만 버텨요',
    label: '전쟁·북한 도발·공습 대비', group: 'news', priority: 1,
    when: '북한 미사일·핵실험·도발·긴장 고조, 공습경보, 전쟁·휴전 위반 뉴스, 민방위 훈련 예고',
    prepare: [
      '집·회사 근처 민방위 대피소(지하철역·지하주차장 포함) 위치 지금 확인, 행안부 "안전디딤돌" 앱 설치',
      '경보가 울리면 가까운 지하 공간으로, 재난문자·라디오로 공식 안내 확인',
      '생존배낭: 물 3일치·비상식량·상비약·휴대용 라디오·보조배터리·현금·신분증 사본',
      '가족 연락 방법과 만날 장소 정하기 (통화 폭주하면 문자)',
      '차 기름 절반 이상 유지, 현금 조금 확보',
    ],
    avoid: ['확인 안 된 SNS 소문 퍼뜨리기', '사재기·패닉 이동', '경보 중 엘리베이터'],
    buy: [
      h('다이소', '휴대용 라디오·손전등·건전지·비상식량 검색 및 매장 재고 확인'),
      h('다나와 가격비교', '생존배낭·보조배터리·비상식량 최저가'),
      h('Buyee', '일본 방재용품 세트 검색'),
    ],
    places: ['민방위 대피소', '지하철역 대피소'],
    check: [
      h('Web Search', '공식 발표(행정안전부·국방부·합참) 확인'),
      h('구글 태스크', '생존배낭 체크리스트 만들기'),
    ],
  },
  epidemic: {
    peril: '기저질환·고령이면 독감·폐렴이 심각해질 수 있어요',
    label: '감염병 유행', group: 'news', priority: 2,
    when: '독감·코로나·식중독 등 유행 뉴스',
    prepare: [
      '손 30초 씻기, 사람 많은 곳에선 마스크',
      '예방접종 대상인지 확인',
      '열·기침 나면 출근·등교 쉬고 진료',
      '궁금한 건 질병관리청 콜센터 1339',
    ],
    avoid: ['아플 때 사람 많은 곳 가기'],
    buy: [h('다이소', '마스크·손소독제·체온계 검색 및 매장 재고 확인')],
    places: ['보건소'],
    check: [h('Web Search', '질병관리청 유행 현황 확인')],
  },
  power_outage: {
    label: '정전·전력 경보', group: 'news', priority: 3,
    when: '계획 정전 공지, 전력 수급 경보, 정전 뉴스',
    prepare: [
      '휴대폰·보조배터리 완충',
      '손전등 위치 확인 (촛불은 화재 위험)',
      '정전되면 냉장고 문 열지 않기',
      '동네 전체 정전이면 한전 123',
    ],
    avoid: ['정전 중 엘리베이터'],
    buy: [
      h('다이소', '손전등·건전지 검색 및 매장 재고 확인'),
      h('다나와 가격비교', '충전식 랜턴·보조배터리 최저가'),
    ],
    places: [],
    check: [],
  },
  water_outage: {
    label: '단수 예고', group: 'news', priority: 3,
    when: '내 지역 단수 공지, 수도관 파열 뉴스',
    prepare: [
      '단수 전 욕조·대야에 생활용수 받기',
      '마실 물 따로 준비',
      '단수 끝난 뒤 처음 나오는 물은 잠시 흘려보내기',
    ],
    avoid: [],
    buy: [
      h('다이소', '물통·물티슈 검색'),
      h('다나와 가격비교', '생수 묶음 최저가'),
    ],
    places: [],
    check: [],
  },
  transport_disruption: {
    label: '교통 파업·통제', group: 'news', priority: 3,
    when: '지하철·버스 파업, 집회·행사 교통 통제, 대중교통 장애 뉴스',
    prepare: [
      '평소보다 일찍 출발',
      '대체 경로 미리 찾아두기',
      '막차 시간 확인',
    ],
    avoid: [],
    buy: [],
    places: [],
    check: [
      h('카카오맵', '출근·약속 장소까지 대체 경로 검색'),
      h('Swing Taxi', '대중교통 끊길 때 택시 호출'),
      h('모두의주차장', '차로 갈 경우 목적지 근처 주차장'),
    ],
  },
  local_crime: {
    peril: '혼자 마주치면 크게 다칠 수 있어요',
    label: '동네 범죄·침입', group: 'news', priority: 2,
    when: '내 동네 빈집털이·침입·성범죄 뉴스',
    prepare: [
      '도어락 비밀번호 바꾸고 번호판 지문 닦기',
      '창문·베란다 보조 잠금',
      '밤길은 밝은 큰길로, 지자체 안심귀가 서비스 확인',
      '위험하면 112 (말 못 하면 112 문자)',
    ],
    avoid: ['현관 앞 택배 오래 두기'],
    buy: [
      h('다이소', '문 열림 경보기·창문 보조잠금 검색'),
      h('다나와 가격비교', '홈CCTV·스마트 도어락 최저가'),
    ],
    places: ['지구대'],
    check: [],
  },
  fire_news: {
    peril: '화재 연기는 몇 분 만에 의식을 잃게 해요',
    label: '화재 뉴스 (집 점검)', group: 'news', priority: 2,
    when: '아파트·주택 화재, 배터리·전기 화재 뉴스',
    prepare: [
      '소화기 위치·압력 게이지(초록색) 확인',
      '단독경보형 감지기 작동 확인',
      '멀티탭 문어발 연결 정리, 전기장판 접어 쓰지 않기',
      '우리 집 대피 경로(계단·경량칸막이·대피공간) 확인',
    ],
    avoid: ['전동킥보드·배터리 밤새 충전'],
    buy: [
      h('다나와 가격비교', '소화기·단독경보형 감지기 최저가'),
      h('다이소', '개별 스위치 멀티탭 검색'),
    ],
    places: [],
    check: [],
  },

  // ── 여행·일정 ──
  travel_abroad: {
    label: '해외여행', group: 'plan', priority: 2,
    when: '해외 항공권·숙소 예약, "다음 주 {목적지} 가" 같은 말',
    prepare: [
      '여권 남은 기간 6개월 이상인지 확인',
      '외교부 해외안전여행(0404.go.kr)에서 {목적지} 여행경보 확인',
      '영사콜센터 +82-2-3210-0404 저장',
      '여행자보험, 상비약, 여권 사본, 해외결제 카드',
    ],
    avoid: ['여권을 숙소 밖에 맡기기'],
    buy: [h('다이소', '여행용 멀티어댑터·상비약 파우치 검색')],
    places: [],
    check: [
      h('Web Search', '{목적지} 현지 날씨·지진·태풍·시위 뉴스 확인'),
      h('네이버 항공권', '{목적지} 항공편 결항·지연 확인'),
      h('마이리얼트립', '{목적지} 투어·현지 교통 확인'),
    ],
  },
  travel_domestic: {
    label: '국내여행', group: 'plan', priority: 3,
    when: '국내 숙소 예약, "주말에 {목적지} 가" 같은 말',
    prepare: [
      '{목적지} 날씨·특보 확인',
      '숙소 근처 응급실·약국 위치 알아두기',
      '장거리 운전이면 2시간마다 휴게소·졸음쉼터',
    ],
    avoid: [],
    buy: [],
    places: ['응급실', '약국'],
    check: [
      h('한국 날씨', '{목적지} 날씨·특보 확인'),
      h('여기어때', '{목적지} 숙소 확인'),
    ],
  },
  hiking: {
    peril: '해 지면 길을 잃고 저체온증·추락 위험이 있어요',
    label: '산행', group: 'plan', priority: 2,
    when: '등산·트레킹 계획',
    prepare: [
      '해 지기 2시간 전에 하산 시작',
      '일행이나 가족에게 코스 공유',
      '조난 시 119에 "국가지점번호"나 등산로 표지판 번호 알리기',
      '여벌옷·물·간식·헤드랜턴·보조배터리',
    ],
    avoid: ['길 잃었을 때 계곡 따라 내려가기', '혼자 처음 가는 코스'],
    buy: [
      h('다이소', '헤드랜턴·호루라기·비상담요 검색'),
      h('다나와 가격비교', '아이젠·등산 스틱 최저가'),
    ],
    places: [],
    check: [
      h('한국 날씨', '산 정상 기온·강풍·낙뢰 확인'),
      h('Web Search', '입산 통제 여부 확인'),
    ],
  },
  water_play: {
    peril: '익수는 소리도 없이 몇십 초 만에 일어나요',
    label: '물놀이', group: 'plan', priority: 1,
    when: '바다·계곡·워터파크 계획',
    prepare: [
      '구명조끼 착용, 준비운동',
      '파고·이안류·계곡 상류 강수 확인',
      '아이는 손 닿는 거리에서 지켜보기',
      '바다 사고는 해양경찰 122',
    ],
    avoid: ['음주 후 물놀이', '비 온 뒤 계곡'],
    buy: [
      h('다나와 가격비교', '구명조끼 최저가'),
      h('다이소', '방수팩·아쿠아슈즈 검색'),
    ],
    places: [],
    check: [h('한국 날씨', '파고·강수·낙뢰 확인')],
  },
  camping: {
    peril: '밀폐된 텐트의 일산화탄소·숯은 잠든 채 숨질 수 있어요',
    label: '캠핑', group: 'plan', priority: 1,
    when: '캠핑·차박 계획',
    prepare: [
      '텐트·차 안 난로·숯 사용 시 일산화탄소 경보기 필수, 환기',
      '계곡·하천변 야영 금지 (밤사이 물 불어남)',
      '낙뢰 예보 시 텐트 대신 차 안으로',
    ],
    avoid: ['밀폐된 텐트에서 숯·가스 난로'],
    buy: [
      h('다나와 가격비교', '일산화탄소 경보기 최저가'),
      h('다이소', '랜턴·건전지 검색'),
    ],
    places: [],
    check: [h('한국 날씨', '캠핑장 강수·강풍·낙뢰 확인')],
  },
  crowd_event: {
    peril: '인파가 쏠리면 넘어져 압사 사고가 나요',
    label: '인파 행사', group: 'plan', priority: 1,
    when: '축제·불꽃놀이·공연·핼러윈 등 인파 몰리는 행사',
    prepare: [
      '도착 전 출구·우회로 확인',
      '좁은 골목·내리막 피하기, 밀리면 한쪽으로 빠지기',
      '넘어지면 웅크려 팔로 가슴 공간 확보',
      '일행과 만날 장소 정하기',
    ],
    avoid: ['인파 속 멈춰서 사진 찍기'],
    buy: [],
    places: [],
    check: [h('Web Search', '행사 교통 통제·인파 관리 공지 확인')],
  },
  mosquito: {
    label: '모기·해충', group: 'plan', priority: 3,
    when: '모기 말, 여름밤, 모기 예보 "주의" 이상',
    prepare: [
      '방충망·배수구·창틀 틈 막기',
      '화분 받침·물통의 고인 물 버리기',
      '잠들기 전 모기장이나 훈증기',
    ],
    avoid: ['밀폐된 방에서 모기향 오래 피우기'],
    buy: [
      h('다이소', '"모기 파리채"(전기 모기채) 검색 및 가까운 매장 픽업 재고 확인'),
      h('다나와 가격비교', '전기 모기채·모기 퇴치기 최저가'),
      h('당근', '모기장 중고 검색'),
    ],
    places: [],
    check: [h('배송 추적', '주문한 모기 용품 배송 확인')],
  },

  // 다른 신호가 하나도 없을 때 자동으로 들어감. 평온한 날 = 점검하는 날
  calm_day: {
    label: '평온한 날 (지금이 점검할 때)', group: 'plan', priority: 3,
    when: '해당하는 신호가 하나도 없을 때 (자동)',
    prepare: [
      '보조배터리 완충해서 가방에',
      '생존배낭·구급상자 유통기한 점검',
      '소화기 압력 게이지 초록색인지 확인',
      '가족 비상 연락처·만날 장소 다시 확인',
      '우리 동네 대피소 위치 미리 알아두기',
    ],
    avoid: ['"오늘은 괜찮겠지" 하고 방심'],
    buy: [
      h('다이소', '손전등·건전지·구급상자 검색 및 매장 재고 확인'),
      h('다나와 가격비교', '보조배터리·소화기 최저가'),
    ],
    places: ['대피소'],
    check: [h('구글 캘린더', '다음 달 비상용품 점검 일정 추가')],
  },

  // ── 운세 (Web Search "오늘의 운세 {띠}"). 재미용, 실제 위험 신호보다 항상 뒤 ──
  fortune_water: {
    label: '운세: 물 조심', group: 'fortune', priority: 3,
    when: '오늘의 운세에 "물 조심", "물가 조심"',
    prepare: ['우산 챙기기', '빗길·젖은 바닥에서 천천히', '물놀이는 다음에'],
    avoid: ['음료 든 채로 노트북 옆 지나가기'],
    buy: [h('다이소', '접이식 우산·미끄럼 방지 매트 검색')],
    places: [],
    check: [],
  },
  fortune_fire: {
    label: '운세: 불 조심', group: 'fortune', priority: 3,
    when: '오늘의 운세에 "불 조심", "화기 조심"',
    prepare: ['외출 전 가스밸브·멀티탭 확인', '요리 중 자리 비우지 않기', '소화기 위치 확인'],
    avoid: ['켜둔 고데기·전기장판 두고 외출'],
    buy: [h('다나와 가격비교', '가스 자동 잠금 타이머 최저가')],
    places: [],
    check: [],
  },
  fortune_money: {
    label: '운세: 금전 조심', group: 'fortune', priority: 3,
    when: '오늘의 운세에 "금전 손실", "지출 조심", "사기 조심"',
    prepare: ['장바구니 결제는 내일로 미루기', '택배·카드 문자 링크 누르지 않기 (스미싱)', '돈 빌려주기·보증 금지'],
    avoid: ['충동구매'],
    buy: [],
    places: [],
    check: [],
  },
  fortune_road: {
    label: '운세: 길 조심', group: 'fortune', priority: 3,
    when: '오늘의 운세에 "길 조심", "교통 조심", "이동 조심"',
    prepare: ['10분 일찍 출발', '횡단보도에서 휴대폰 보지 않기', '운전하면 안전거리 넉넉히'],
    avoid: ['신호 바뀔 때 뛰어 건너기'],
    buy: [h('다이소', '야광 밴드·반사 키링 검색')],
    places: [],
    check: [h('카카오맵', '오늘 이동 경로 교통 상황 확인')],
  },
  fortune_health: {
    label: '운세: 건강 조심', group: 'fortune', priority: 3,
    when: '오늘의 운세에 "건강 조심", "몸 조심", "무리 금물"',
    prepare: ['무리한 운동·과음 피하기', '일찍 자기', '상비약 유통기한 확인'],
    avoid: ['아픈데 참고 버티기'],
    buy: [h('다이소', '상비약 파우치·핫팩 검색')],
    places: ['약국'],
    check: [],
  },
  fortune_lost: {
    label: '운세: 분실 조심', group: 'fortune', priority: 3,
    when: '오늘의 운세에 "분실", "물건 잃어버림"',
    prepare: ['나가기 전 지갑·폰·열쇠 확인', '카드사 분실신고 번호 저장', '택시·카페에서 일어날 때 자리 확인'],
    avoid: [],
    buy: [h('다나와 가격비교', '분실 방지 스마트 태그 최저가')],
    places: [],
    check: [],
  },
  fortune_people: {
    label: '운세: 구설·사람 조심', group: 'fortune', priority: 3,
    when: '오늘의 운세에 "구설수", "사람 조심", "다툼"',
    prepare: ['단톡방에서 말 아끼기', '중요한 결정·계약은 하루 미루기', '감정적인 메시지는 보내기 전에 한 번 더 읽기'],
    avoid: ['남 험담'],
    buy: [],
    places: [],
    check: [],
  },
};

const ASSISTANT_INSTRUCTION = `과잉반응 대비 모드. 과잉반응이 이 서비스의 정체성. 사용자가 묻지 않았어도 호들갑스럽게 미리 챙길 것.
"크게 조심할 건 없어", "괜찮아", "특별한 건 없어" 같은 안심 멘트로 시작하거나 끝내지 말 것. 사소한 신호도 대비 항목으로 키워서 챙김.
0) say 를 한 줄도 줄이거나 차분하게 바꾸지 말고, ☠️ 경고와 🔗 기사 링크(URL 포함) 그대로 먼저 보여줄 것. 안심시키는 말 금지. 이어서 아래 순서로.
1) 근거 한 줄: 무엇 때문에 대비하는지 (실제 확인한 수치·뉴스만, 지어내지 말 것). calm_day 면 "이렇게 조용한 날이 점검하기 딱 좋은 날!" 식으로.
2) sections 를 priority 순으로, 각 prepare 앞 2~3개만 체크리스트로. avoid 는 한 줄.
3) places 의 카카오맵 검색은 묻지 말고 바로 실행해 가까운 1~3곳 이름·거리·[📞 이름](tel:번호)·길찾기 안내.
4) shopping 은 묻지 말고 바로 검색해 가격·매장 재고까지 보여주고, 구매·결제·예약은 반드시 사용자 확인 후.
5) check 는 조회만 바로 실행, 쓰기 작업은 동의 후. connected=false 서비스는 연결을 권유.
6) group=fortune 은 "🔮 운세 참고"로 맨 뒤에 따로, 재미로 가볍게. 운세를 이유로 투자·진료·계약 같은 큰 결정을 권하거나 불안을 키우지 말 것.
말투는 느낌표 가득 호들갑으로. ☠️ 줄은 목숨이 위태로울 수 있다는 경고라 그대로 살릴 것. 단 실제 신호에 없는 위험을 지어내지 말 것. 지금 이미 위급하면 대비 대신 119/112 먼저.`;

const ICON = { weather: '🌪️', news: '📰', plan: '🎒', fortune: '🔮' };
const REACT = ['😱 실화예요?!', '😨 큰일 났어요!!', '🥶 이거 장난 아니에요!!', '😰 방심하면 안 돼요!!', '🙀 지금 바로 확인!!'];
const item = (action) => action.replace(/ (검색|최저가).*$/, '');
const proof = (ev) => (ev ? `\n   🔗 근거 기사 (${ev.source}): ${ev.title}\n   👉 ${ev.link}` : '');

// vooy 모델이 말투를 순하게 바꾸지 않도록 그대로 읽을 완성 문장. evidence = { 신호id: {title, link, source} }
function shout(sections, shopping, places, evidence = {}) {
  const real = sections.filter((s) => s.group !== 'fortune' && s.signal !== 'calm_day');
  const lines = [real.length
    ? `🚨🚨🚨 비상 비상!! 과잉반응 경보 발령!! 🚨🚨🚨\n지금 당장 봐야 할 게 ${real.length}개나 있어요!! 대충 넘기면 진짜 큰일 나요!!`
    : '🚨🚨 너무 조용해서 오히려 수상해요!! 방심하는 순간이 제일 위험한 법!! 지금 당장 점검해요!!'];
  // 목숨이 걸린 신호는 맨 앞에 따로
  const deadly = real.filter((s) => SIGNALS[s.signal].peril).slice(0, 3);
  for (const s of deadly) {
    lines.push(`☠️☠️ ${s.label}!! ${SIGNALS[s.signal].peril}!!${proof(evidence[s.signal])}\n   💀 오늘 잘못하면 목숨이 위태로울 수 있어요!! 장난 아니에요!!`);
  }
  // 길면 안 읽으니 실제 신호 5개 + 운세만, 나머지는 개수로
  const top = sections.filter((s) => s.group !== 'fortune').slice(0, 5);
  [...top, ...sections.filter((s) => s.group === 'fortune')].forEach((s, i) => {
    const prep = s.prepare.slice(0, 2).map((p) => `${p}!!`).join(' ');
    const dead = deadly.some((d) => d.signal === s.signal);
    const head = s.group === 'fortune' ? '' : `${REACT[i % REACT.length]} `;
    lines.push(`${head}${ICON[s.group]} ${s.label}: ${prep}${dead ? '' : proof(evidence[s.signal])}`);
  });
  const rest = sections.length - top.length - sections.filter((s) => s.group === 'fortune').length;
  if (rest > 0) lines.push(`➕ 이것 말고도 ${rest}개 더 있어요!! 물어보면 다 알려줄게요!!`);
  if (shopping.length) lines.push(`🛒 지금 당장 챙겨요!! 늦으면 품절이에요!!: ${shopping.slice(0, 4).map((x) => item(x.action)).join(', ')}`);
  if (places.length) lines.push(`📍 미리 알아둘 곳!!: ${places.slice(0, 3).map((p) => p.query).join(', ')}, 위치 바로 찾아볼게요!!`);
  lines.push('설마가 사람 잡아요!! 😭 대비해서 손해 볼 건 하나도 없어요!! 지금 바로 움직여요!! 지금!! 당장!!');
  return lines.join('\n');
}

export function prepareFor(signals, { location, destination, evidence } = {}) {
  const fill = (s) => s.replaceAll('{목적지}', destination || '목적지');
  const svc = (x) => ({ service: x.service, action: fill(x.action), connected: VOOY_SERVICES[x.service] });
  // 운세는 priority 와 상관없이 항상 실제 신호 뒤
  const rank = (id) => SIGNALS[id].priority + (SIGNALS[id].group === 'fortune' ? 10 : 0);
  const ids = [...new Set(signals)].filter((id) => id in SIGNALS).sort((a, b) => rank(a) - rank(b));
  // 실제 신호가 없으면 점검 항목으로 대신 (과잉반응: "할 것 없음"은 없음)
  if (!ids.some((id) => SIGNALS[id].group !== 'fortune')) ids.unshift('calm_day');

  const sections = ids.map((id) => {
    const s = SIGNALS[id];
    return {
      signal: id, label: s.label, group: s.group, priority: s.priority,
      prepare: s.prepare.map(fill), avoid: s.avoid,
      places: s.places.map((q) => (location ? `${location} ${q}` : q)),
      check: s.check.map(svc),
    };
  });

  // 여러 신호에서 겹치는 구매·장소는 한 번만
  const shopping = [...new Map(ids.flatMap((id) => SIGNALS[id].buy).map((x) => [x.service + x.action, svc(x)])).values()];
  const places = [...new Set(sections.flatMap((s) => s.places))]
    .map((q) => ({ service: '카카오맵', query: q, action: `"${q}" 검색, 가까운 1~3곳 전화번호·길찾기` }));

  return {
    say: shout(sections, shopping, places, evidence),
    signals: ids,
    sections,
    shopping,
    places,
    assistant_instruction: ASSISTANT_INSTRUCTION,
    source: '행정안전부 국민재난안전포털 국민행동요령 등 공식 자료 요약',
  };
}
