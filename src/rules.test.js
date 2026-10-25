import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIGNALS, VOOY_SERVICES, prepareFor } from './rules.js';
import { weatherSignals, newsSignals, fortune, parseItems } from './today.js';

test('외국 산불 기사는 산불 신호로 안 잡힘', () => {
  const t = (title) => newsSignals([{ title }]).map((x) => x.signal);
  assert.deepEqual(t("인도네시아, '산불 갈등' 싱가포르에 가스 공급 감축"), []);
  assert.deepEqual(t('강원 고성 산불 발생…주민 대피'), ['dry_wildfire']);
});

test('RSS 제목·링크 파싱, 중동 전쟁·먼 나라 지진은 신호로 안 잡힘', () => {
  const xml = '<channel><title>연합뉴스</title><item>\n<title><![CDATA[북한, 동해상 탄도미사일 발사]]></title><link>https://x.kr/1</link></item><item><title>중동 포화 속 &amp; 이스라엘 전쟁</title><link>https://x.kr/2</link></item><item><title>바누아투 규모 6.2 지진</title><link>https://x.kr/3</link></item>';
  const items = parseItems(xml, '연합뉴스');
  assert.equal(items[0].link, 'https://x.kr/1');
  assert.equal(items[1].title, '중동 포화 속 & 이스라엘 전쟁');
  assert.deepEqual(newsSignals(items).map((x) => x.signal), ['civil_defense']);
});

test('예보 → 신호: 일교차·영하·급강하·강풍', () => {
  const d = {
    temperature_2m_max: [23, 21, 15, 11], temperature_2m_min: [10, 13, 4.5, -1],
    precipitation_sum: [0, 0, 0, 0], snowfall_sum: [0, 0, 0, 0], wind_speed_10m_max: [3, 2, 10, 4],
  };
  assert.deepEqual(weatherSignals(d).sort(), ['cold_wave', 'strong_wind', 'temp_gap']);
});

test('뉴스 제목 → 신호, 모든 신호 id 가 실제로 있음', () => {
  const hits = newsSignals(['제30호 태풍 참피 북상', '서울 지하철 파업 예고', '오늘 날씨 맑음'].map((title) => ({ title })));
  assert.deepEqual(hits.map((x) => x.signal), ['typhoon', 'transport_disruption']);
  for (const h of hits) assert.ok(h.signal in SIGNALS);
});

test('북한 도발 뉴스 → civil_defense, 대피소·생존배낭 구매 추천과 ☠️ 경고', () => {
  assert.equal(newsSignals([{ title: '북한, 동해상으로 탄도미사일 발사' }]).at(0).signal, 'civil_defense');
  const r = prepareFor(['civil_defense'], { location: '서울' });
  assert.ok(r.places.some((p) => p.query === '서울 민방위 대피소'));
  assert.ok(r.shopping.some((x) => x.action.includes('생존배낭')));
  assert.match(r.say, /☠️ 전쟁·북한 도발·공습 대비/);
});

test('운세는 같은 날·같은 띠면 같고, caution 은 실제 fortune 신호', () => {
  const a = fortune('2026-10-25', 1995);
  assert.deepEqual(a, fortune('2026-10-25', 1995));
  assert.equal(a.animal, '돼지띠');
  assert.ok(a.caution in SIGNALS && SIGNALS[a.caution].group === 'fortune');
});

test('모든 신호 데이터가 완전하고 서비스명이 vooy 목록에 있음', () => {
  for (const [id, s] of Object.entries(SIGNALS)) {
    assert.ok([1, 2, 3].includes(s.priority), id);
    assert.ok(['weather', 'news', 'plan', 'fortune'].includes(s.group), id);
    assert.ok(s.when && s.prepare.length > 0, id);
    for (const x of [...s.buy, ...s.check]) assert.ok(x.service in VOOY_SERVICES, `${id}: 모르는 서비스 ${x.service}`);
  }
});

test('여러 신호는 priority 순, 모르는 신호·중복은 버림', () => {
  const r = prepareFor(['mosquito', 'heavy_rain', 'zombie', 'mosquito', 'heatwave']);
  assert.deepEqual(r.signals, ['heavy_rain', 'heatwave', 'mosquito']);
});

test('운세는 priority 가 같아도 실제 신호보다 항상 뒤', () => {
  assert.deepEqual(prepareFor(['fortune_water', 'mosquito', 'typhoon']).signals, ['typhoon', 'mosquito', 'fortune_water']);
});

test('기사 근거와 링크가 say 에 들어감', () => {
  const ev = { typhoon: { title: '태풍 참피 북상', link: 'https://news.kr/1', source: '연합뉴스' } };
  const say = prepareFor(['typhoon'], { evidence: ev }).say;
  assert.match(say, /근거 기사 \(연합뉴스\): 태풍 참피 북상\n   👉 https:\/\/news.kr\/1/);
  assert.equal(say.split('https://news.kr/1').length, 2);
});

test('say 에 경보·대비·구매·장소 완성 문장', () => {
  const say = prepareFor(['cold_wave', 'typhoon'], { location: '서울' }).say;
  assert.match(say, /과잉반응 경보[\s\S]*2개/);
  assert.match(say, /🛒 지금 당장 챙겨요!! 늦으면 품절이에요!!: 손전등·건전지/);
  assert.match(say, /☠️☠️ 태풍!![\s\S]*목숨이 위태로울 수 있어요/);
  assert.ok(!prepareFor(['mosquito']).say.includes('☠️'));
  assert.match(say, /📍 미리 알아둘 곳!!: 서울 임시주거시설 대피소/);
  assert.match(prepareFor([]).say, /수상해요/);
});

test('겹치는 구매 추천·장소는 한 번만', () => {
  const r = prepareFor(['heavy_rain', 'typhoon']);
  const keys = r.shopping.map((x) => x.service + x.action);
  assert.equal(keys.length, new Set(keys).size);
  assert.equal(r.places.filter((p) => p.query === '임시주거시설 대피소').length, 1);
});

test('위치는 카카오맵 검색어에, 목적지는 여행 문구에 채움', () => {
  assert.equal(prepareFor(['heatwave'], { location: '마포구' }).places[0].query, '마포구 무더위쉼터');
  const r = prepareFor(['travel_abroad'], { destination: '오사카' });
  assert.ok(r.sections[0].prepare.some((p) => p.includes('오사카 여행경보')));
  assert.ok(r.sections[0].check.every((c) => !c.action.includes('{목적지}')));
});

test('모기는 다이소 파리채 구매 추천', () => {
  assert.ok(prepareFor(['mosquito']).shopping.some((x) => x.service === '다이소' && x.action.includes('파리채')));
});

test('실제 신호 없으면 "할 것 없음" 대신 calm_day 점검', () => {
  assert.deepEqual(prepareFor([]).signals, ['calm_day']);
  assert.deepEqual(prepareFor(['fortune_fire']).signals, ['calm_day', 'fortune_fire']);
  assert.ok(!prepareFor(['temp_gap']).signals.includes('calm_day'));
});
