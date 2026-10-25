// 오늘의 호들갑: 서버가 직접 날씨·뉴스·운세를 모아 신호로 바꾸고 prepareFor 로 넘김.
// 날씨·대기질은 Open-Meteo(키 없음), 뉴스는 국내 언론사 RSS, 운세는 날짜+띠로 직접 생성(재미용).
import { prepareFor } from './rules.js';

const SEOUL = { name: '서울', latitude: 37.5665, longitude: 126.978 };
// Open-Meteo 지오코딩이 한글 지명을 잘 못 찾아서 시·도는 직접
const CITIES = {
  서울: [37.5665, 126.978], 부산: [35.1796, 129.0756], 대구: [35.8714, 128.6014], 인천: [37.4563, 126.7052],
  광주: [35.1595, 126.8526], 대전: [36.3504, 127.3845], 울산: [35.5384, 129.3114], 세종: [36.48, 127.289],
  수원: [37.2636, 127.0286], 성남: [37.42, 127.1265], 고양: [37.6584, 126.832], 용인: [37.2411, 127.1776],
  춘천: [37.8813, 127.7298], 강릉: [37.7519, 128.8761], 청주: [36.6424, 127.489], 천안: [36.8151, 127.1139],
  전주: [35.8242, 127.148], 포항: [36.019, 129.3435], 창원: [35.228, 128.6811], 제주: [33.4996, 126.5312],
};

// 3일 예보 → 신호. 과잉반응이라 기준은 낮게
export function weatherSignals(d) {
  const out = new Set();
  d.temperature_2m_max.forEach((max, i) => {
    const min = d.temperature_2m_min[i];
    if (max >= 30) out.add('heatwave');
    if (min <= 0 || (i > 0 && d.temperature_2m_min[i - 1] - min >= 8)) out.add('cold_wave');
    if (max - min >= 10) out.add('temp_gap');
    if (d.wind_speed_10m_max[i] >= 9) out.add('strong_wind');
    if (d.precipitation_sum[i] >= 30) out.add('heavy_rain');
    if (d.snowfall_sum[i] > 0) out.add('heavy_snow');
  });
  return [...out];
}

const NEWS_KEYWORDS = {
  earthquake: /(한반도|국내|경북|경주|포항|제주|동해|일본|도쿄|오가사와라|대만).{0,25}(지진|여진)|(지진|여진).{0,25}(한반도|국내|일본|대만)/, typhoon: /태풍/, dry_wildfire: /산불.{0,20}(발생|확산|진화|대응|대피|피해)|산불(주의|경보|특보)|건조(주의보|경보|특보)/,
  transport_disruption: /파업|운행 중단|교통 통제|지하철 지연/, water_outage: /단수/,
  power_outage: /정전/, epidemic: /독감|코로나|감염병|식중독|유행/,
  fire_news: /화재|불이 나|불나/, civil_defense: /북한|김정은|北|핵실험|ICBM|탄도|한반도|휴전선|대북|공습경보|민방위/,
  local_crime: /빈집|절도|침입|흉기/, heavy_rain: /호우|폭우|침수/, cold_wave: /한파|첫 얼음|영하/,
};
// Google 뉴스는 Cloudflare 에서 503 이라 국내 언론사 RSS 를 직접
export const NEWS_FEEDS = [
  ['연합뉴스', 'https://www.yna.co.kr/rss/news.xml'],
  ['연합뉴스', 'https://www.yna.co.kr/rss/politics.xml'],
  ['동아일보', 'https://rss.donga.com/total.xml'],
  ['경향신문', 'https://www.khan.co.kr/rss/rssdata/total_news.xml'],
  ['한겨레', 'https://www.hani.co.kr/rss/'],
];

const clean = (t) => t.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&quot;|&#34;/g, '"').replace(/&#39;|&apos;/g, "'").trim();

export function parseItems(xml, source = '') {
  return [...xml.matchAll(/<item[\s>](.*?)<\/item>/gs)].flatMap(([, body]) => {
    const title = body.match(/<title>(.*?)<\/title>/s)?.[1];
    const link = body.match(/<link>(.*?)<\/link>/s)?.[1];
    return title && link ? [{ title: clean(title), link: clean(link), source }] : [];
  });
}

// items = [{title, link, source}], 신호마다 처음 걸린 기사 하나
export function newsSignals(items) {
  const real = items.filter((x) => !/훈련|대비 교육|캠페인/.test(x.title));
  return Object.entries(NEWS_KEYWORDS).flatMap(([id, re]) => {
    const hit = real.find((x) => re.test(x.title));
    return hit ? [{ signal: id, ...hit }] : [];
  });
}

const ZODIAC = ['원숭이', '닭', '개', '돼지', '쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양'];
const CAUTIONS = ['fortune_water', 'fortune_fire', 'fortune_money', 'fortune_road', 'fortune_health', 'fortune_lost', 'fortune_people'];
const LUCKY = ['노란 우산', '보조배터리', '손전등', '핫팩', '물 한 병', '호루라기', '반창고'];

// 같은 날·같은 띠면 항상 같은 결과
export function fortune(date, birthYear) {
  const animal = birthYear ? ZODIAC[birthYear % 12] : null;
  let n = 0;
  for (const c of `${date}${animal ?? ''}`) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  const score = (n % 5) + 1; // 1~5
  return {
    animal: animal ? `${animal}띠` : '띠 모름 (출생연도 주면 띠별로)',
    score,
    mood: score >= 4 ? '대길' : score <= 2 ? '흉' : '평',
    caution: CAUTIONS[n % CAUTIONS.length],
    lucky_item: LUCKY[(n >> 3) % LUCKY.length],
  };
}

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function geocode(location) {
  if (!location) return SEOUL;
  const city = Object.keys(CITIES).find((c) => location.includes(c));
  if (city) return { name: location, latitude: CITIES[city][0], longitude: CITIES[city][1] };
  const name = location.replace(/(특별시|광역시|시|구|군|동)$/, '');
  const j = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&language=ko&count=1`).catch(() => ({}));
  return j.results?.[0] ? { name: location, latitude: j.results[0].latitude, longitude: j.results[0].longitude } : { ...SEOUL, name: `${location}(못 찾아서 서울 기준)` };
}

export async function todayHodulgab({ location, birthYear } = {}) {
  const place = await geocode(location);
  const q = `latitude=${place.latitude}&longitude=${place.longitude}&timezone=Asia%2FSeoul`;
  const [w, air, feeds] = await Promise.all([
    getJson(`https://api.open-meteo.com/v1/forecast?${q}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_speed_10m_max&wind_speed_unit=ms&forecast_days=4`).catch(() => null),
    getJson(`https://air-quality-api.open-meteo.com/v1/air-quality?${q}&hourly=pm2_5&forecast_days=1`).catch(() => null),
    Promise.all(NEWS_FEEDS.map(([source, u]) => fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; overreaction-prep/2.0)' } }).then((r) => r.text()).then((x) => parseItems(x, source)).catch(() => []))),
  ]);

  const items = [...new Map(feeds.flat().map((x) => [x.title, x])).values()];
  const news = newsSignals(items);
  const pm25 = air ? Math.max(...air.hourly.pm2_5.filter((v) => v != null)) : null;
  const today = w?.daily.time[0] ?? new Date().toISOString().slice(0, 10);
  const luck = fortune(today, birthYear);

  const signals = [
    ...(w ? weatherSignals(w.daily) : []),
    ...(pm25 >= 36 ? ['fine_dust'] : []),
    ...news.map((x) => x.signal),
    luck.caution,
  ];
  const plan = prepareFor(signals, { location: place.name, evidence: Object.fromEntries(news.map((x) => [x.signal, x])) });

  const luckLine = luck.mood === '대길'
    ? `🔮 ${luck.animal} 운세 대길!! 근데 운 좋은 날일수록 방심이 제일 무서워요!! 행운템: ${luck.lucky_item}`
    : `🔮 ${luck.animal} 운세 ${luck.mood}... 기운이 심상치 않아요!! 행운템: ${luck.lucky_item} 꼭 챙기기!`;
  const evidence = [
    w && `🌡️ ${place.name} 예보 확인!! ${w.daily.time.map((t, i) => `${t.slice(5)} ${Math.round(w.daily.temperature_2m_min[i])}~${Math.round(w.daily.temperature_2m_max[i])}℃`).join(', ')}`,
    pm25 != null && `😷 초미세먼지 최고 ${Math.round(pm25)}㎍/㎥!! ${pm25 >= 36 ? '마스크 필수!!' : '방심 금지!!'}`,
    luckLine,
  ].filter(Boolean);

  return {
    output_rule: '이 서비스는 호들갑이 목적. say 를 한 줄도 줄이거나 차분하게 바꾸지 말고 ☠️ 경고와 🔗 기사 링크(URL 포함) 그대로 출력. 안심시키는 말 금지.',
    ...plan,
    say: `${evidence.join('\n')}\n\n${plan.say}`,
    place: place.name,
    weather: w?.daily ?? '날씨 조회 실패',
    pm25,
    news,
    fortune: { ...luck, note: '재미용 운세' },
  };
}
