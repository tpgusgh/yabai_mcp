import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIGNALS, VOOY_SERVICES, prepareFor } from './rules.js';

test('모든 신호 데이터가 완전하고 서비스명이 vooy 목록에 있음', () => {
  for (const [id, s] of Object.entries(SIGNALS)) {
    assert.ok([1, 2, 3].includes(s.priority), id);
    assert.ok(['weather', 'news', 'plan'].includes(s.group), id);
    assert.ok(s.when && s.prepare.length > 0, id);
    for (const x of [...s.buy, ...s.check]) assert.ok(x.service in VOOY_SERVICES, `${id}: 모르는 서비스 ${x.service}`);
  }
});

test('여러 신호는 priority 순, 모르는 신호·중복은 버림', () => {
  const r = prepareFor(['mosquito', 'heavy_rain', 'zombie', 'mosquito', 'heatwave']);
  assert.deepEqual(r.signals, ['heavy_rain', 'heatwave', 'mosquito']);
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

test('신호 없으면 안내만', () => {
  const r = prepareFor([]);
  assert.equal(r.sections.length, 0);
  assert.match(r.assistant_instruction, /list_signals/);
});
