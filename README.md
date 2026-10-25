# 과잉반응 대비 MCP (vooy 전용)

사용자가 묻기 전에 오늘 날씨·뉴스·운세·여행·일정을 보고 대비할 일, 구매 추천(다이소·다나와 등), 대피소·쉼터 장소를 알려주는 MCP 서버.
날씨·뉴스·운세 조회는 vooy 기본 서비스(한국 날씨, Web Search)가 하고, 이 서버는 신호를 받아 대비책을 돌려줌. 운세 신호는 재미용이라 항상 실제 신호 뒤에 나옴.

```
npm install
npm start          # wrangler dev, 로컬 http://localhost:8787/mcp
npm test
npm run deploy     # Cloudflare Workers 배포 (npx wrangler login 필요)
```

- vooy 사용자 지정 MCP에 넣을 URL: `https://<워커 이름>.<계정>.workers.dev/mcp`
- 도구: `prepare_for(signals, location?, destination?)`, `list_signals`
- 헬스체크: `GET /health`
- Cloudflare Workers, Streamable HTTP, stateless, 인증 없음.
- 신호·대비책 수정: `src/rules.js`. 배포 전 행동요령 문구는 공식 자료(국민재난안전포털 등)와 대조 검수.
