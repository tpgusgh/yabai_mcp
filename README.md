# 과잉반응 대비 MCP (vooy 전용)

사용자가 묻기 전에 오늘 날씨·뉴스·여행·일정을 보고 대비할 일, 구매 추천(다이소·다나와 등), 대피소·쉼터 장소를 알려주는 MCP 서버.
날씨·뉴스 조회는 vooy 기본 서비스(한국 날씨, Web Search)가 하고, 이 서버는 신호를 받아 대비책을 돌려줌.

```
npm install
npm start          # PORT 환경변수, 기본 3000
npm test
```

- vooy 사용자 지정 MCP에 넣을 URL: `https://<배포 도메인>/mcp`
- 도구: `prepare_for(signals, location?, destination?)`, `list_signals`
- 헬스체크: `GET /health`
- Node 18 이상. Streamable HTTP, stateless, 인증 없음.
- 신호·대비책 수정: `src/rules.js`. 배포 전 행동요령 문구는 공식 자료(국민재난안전포털 등)와 대조 검수.
