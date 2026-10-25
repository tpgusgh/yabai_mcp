# 야바이 (yabai) — 호들갑 MCP

![야바이 썸네일](assets/thumbnail.png)

물어보기 전에 먼저 호들갑 떨어주는 vooy 전용 MCP 서버.
오늘 날씨·미세먼지·뉴스·운세를 서버가 직접 모아서, 대비할 일·구매 추천(다이소·다나와 등)·대피소 검색어를 호들갑스럽게 알려줍니다.

## 데이터는 어디서 가져오나

모두 서버(Cloudflare Workers)가 요청 때마다 직접 가져옵니다. 별도 API 키나 계정 연동이 필요 없습니다.

| 데이터 | 출처 | 비고 |
|---|---|---|
| 날씨 (오늘 포함 4일: 최고·최저기온, 강수량, 적설, 최대 풍속) | [Open-Meteo Forecast API](https://open-meteo.com/en/docs) `api.open-meteo.com/v1/forecast` | 무료, 키 없음 |
| 초미세먼지(PM2.5) | [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) `air-quality-api.open-meteo.com` | 오늘 시간별 최댓값 사용 |
| 지역 → 좌표 | 서울·부산 등 주요 도시 20곳은 코드에 내장, 그 밖의 지명은 [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) | 못 찾으면 서울 기준 |
| 뉴스 | 국내 언론사 RSS 5개 (아래) | 제목·링크·매체명을 그대로 사용 |
| 운세 | 외부 조회 없음. 날짜 + 띠(출생연도)로 서버가 만든 값 | 재미용, 같은 날·같은 띠면 항상 같은 결과 |
| 행동요령 | 행정안전부 국민재난안전포털, 소방청, 질병관리청, 외교부 해외안전여행 자료를 요약해 `src/rules.js`에 직접 작성 | 배포 전 공식 자료와 대조 검수 필요 |

### 뉴스 RSS

- 연합뉴스: https://www.yna.co.kr/rss/news.xml, https://www.yna.co.kr/rss/politics.xml
- 동아일보: https://rss.donga.com/total.xml
- 경향신문: https://www.khan.co.kr/rss/rssdata/total_news.xml
- 한겨레: https://www.hani.co.kr/rss/

Google 뉴스 RSS는 Cloudflare에서 503으로 막혀서 쓰지 않습니다. RSS에 올라온 최신 기사 제목에서 키워드를 찾아 신호로 바꾸고, 신호마다 처음 걸린 기사 한 건을 근거(제목+링크)로 보여줍니다.
RSS에는 최신 기사만 있어서 오래된 기사는 잡히지 않습니다.

## 어떻게 신호로 바꾸나

- **날씨 (3일 예보)**: 최고 30℃ 이상 → 폭염, 최저 0℃ 이하 또는 하루 새 8℃ 이상 하락 → 한파, 일교차 10℃ 이상, 풍속 9m/s 이상 → 강풍, 강수 30mm 이상 → 호우, 적설 → 대설. 기준은 과잉반응이라 일부러 낮게 잡았습니다.
- **미세먼지**: 초미세먼지 36㎍/㎥ 이상 → 미세먼지 신호.
- **뉴스 키워드**: 지진(국내·일본·대만 관련만), 태풍, 산불(발생·확산·대피 또는 산불·건조 특보), 파업·교통 통제, 단수, 정전, 감염병, 화재, 호우, 한파, 북한·핵실험·탄도 등 한반도 안보 키워드. "훈련", "캠페인" 기사는 제외합니다.
- **신호가 하나도 없는 날**: "평온한 날 점검" 항목(보조배터리, 소화기, 대피소 위치 확인)을 대신 줍니다.
- 신호 목록과 대비책은 [src/rules.js](src/rules.js), 날씨·뉴스·운세 처리는 [src/today.js](src/today.js)에 있습니다.

## 도구

| 도구 | 설명 |
|---|---|
| `today_hodulgab(location?, birth_year?)` | 위 데이터를 모두 모아 호들갑 브리핑(`say`)을 돌려줌. "오늘 뭐 조심해야 돼?"에 사용 |
| `prepare_for(signals, location?, destination?)` | 이미 아는 신호(여행·산행·캠핑 등)를 넘기면 대비책을 돌려줌 |
| `list_signals` | 서버가 아는 신호 목록 |

## 실행

```
npm install
npm start          # wrangler dev, 로컬 http://localhost:8787/mcp
npm test
npm run deploy     # Cloudflare Workers 배포 (npx wrangler login 필요)
```

- vooy 사용자 지정 MCP에 넣을 URL: `https://<워커 이름>.<계정>.workers.dev/mcp`
- 헬스체크: `GET /health`
- Cloudflare Workers, Streamable HTTP, stateless, 인증 없음.

## 알아두세요

- 말투는 일부러 과장한 연출입니다. 수치·기사·링크는 실제 데이터 그대로입니다.
- vooy의 AI가 결과를 자기 말투로 줄이거나 순하게 바꿀 수 있습니다. 서버는 출력 정책(`policy`)을 결과 맨 앞에 넣어 요청할 뿐, 강제할 수 없습니다. 확실히 하려면 vooy "성격 · 말투 · 지침"에도 같은 규칙을 넣으세요.
- 위급할 때는 대비 안내보다 119·112가 먼저입니다.
