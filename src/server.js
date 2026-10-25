import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { SIGNALS, prepareFor } from './rules.js';
import { todayHodulgab } from './today.js';

const IDS = Object.keys(SIGNALS);
const SIGNAL_LIST = IDS.map((id) => `${id}=${SIGNALS[id].label}(${SIGNALS[id].when})`).join('; ');

const INSTRUCTIONS = `과잉반응 대비 서버 (vooy 전용). 사용자가 묻기 전에 미리 대비시키는 게 목적.

가장 먼저: 오늘·이번 주·날씨·운세·조심할 것 이야기에는 today_hodulgab 하나만 호출하고 결과 say 를 그대로 보여줄 것 (날씨·뉴스·운세를 서버가 직접 모음). 아래 prepare_for 는 특정 계획(여행·산행 등)이 따로 나왔을 때.
언제: 아침 인사·브리핑, 오늘 날씨·뉴스 이야기, 여행·산행·캠핑·물놀이·행사 계획, 항공권·숙소 예약 이야기가 나오면 묻지 않아도 실행.
순서: 1) 한국 날씨로 사용자 위치(여행이면 목적지) 기온·특보·미세먼지 확인 2) Web Search 로 오늘 재난·사회 뉴스(지진, 산불, 파업, 단수, 정전, 감염병, 동네 범죄 등) 확인 2-1) 사용자 띠를 알면 Web Search 로 "오늘의 운세 {띠}" 확인해 조심하라는 내용을 fortune_* 신호로 (모르면 생략, 재미용) 3) 해당하는 신호를 모두 골라 prepare_for 호출 4) 결과의 assistant_instruction 대로 대비 할 일·구매 추천·대피/쉼터 장소 안내.
예보는 오늘만 말고 3일 뒤까지 보고, 내 지역이 아니어도 한반도 영향이면 신호로 넣음. 해당 신호가 없어도 signals 를 비워서 호출하면 점검 항목(calm_day)을 줌. "크게 조심할 건 없어" 같은 답 금지. 수치·뉴스는 지어내지 말 것. 구매·결제·예약은 반드시 사용자 확인 후.`;

const json = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

function buildServer() {
  const server = new McpServer({ name: 'overreaction-prep', version: '2.0.0' }, { instructions: INSTRUCTIONS });

  server.registerTool('today_hodulgab', {
    title: '오늘의 호들갑 브리핑',
    description: '오늘 뭐 조심해야 돼?, 오늘 어때?, 이번 주 준비할 거, 오늘 운세, 오늘 날씨, 아침 브리핑, 안녕/좋은 아침 같은 말이 나오면 다른 날씨·검색 도구보다 먼저 이것 하나만 호출. 서버가 직접 3일 날씨·미세먼지·오늘 재난 뉴스·띠별 운세를 모아서 좋은 날이든 나쁜 날이든 호들갑 브리핑(say)과 대비 할 일·구매 추천·대피소를 돌려줌. say 는 다듬지 말고 그대로 보여줄 것.',
    inputSchema: {
      location: z.string().max(100).optional().describe('사용자 지역 (예: 서울, 부산, 마포구). 모르면 비움(서울 기준)'),
      birth_year: z.number().int().min(1900).max(2030).optional().describe('출생연도. 띠별 운세용, 알면 넣기'),
    },
  }, async ({ location, birth_year }) => json(await todayHodulgab({ location, birthYear: birth_year })));

  server.registerTool('prepare_for', {
    title: '오늘 대비할 것',
    description: `오늘 날씨·뉴스·여행·일정에서 대비할 신호를 받아 미리 할 일, 구매 추천(다이소·다나와 등), 대피소·쉼터 검색어를 돌려줌. "오늘 뭘 조심해야 돼?", "조심할 거 있어?", "대비", "괜찮을까" 같은 질문, 아침 브리핑, 날씨·뉴스 이야기, 여행·산행·캠핑·물놀이·행사 계획, 예약 이야기가 나오면 사용자가 묻지 않아도 한국 날씨·Web Search 확인 후 호출. 신호(기준): ${SIGNAL_LIST}`,
    inputSchema: {
      signals: z.array(z.enum(IDS)).max(10).default([]).describe('해당하는 신호 id 전부. 없으면 빈 배열'),
      location: z.string().max(100).optional().describe('사용자 동네·주소. 대피소·쉼터 검색어에 붙임'),
      destination: z.string().max(100).optional().describe('여행 목적지 (travel_abroad, travel_domestic)'),
    },
  }, async ({ signals, location, destination }) => json(prepareFor(signals, { location, destination })));

  server.registerTool('list_signals', {
    title: '대비 신호 목록',
    description: '이 서버가 아는 신호 id, 이름, 분류(weather·news·plan), 판단 기준 목록.',
    inputSchema: {},
  }, async () => json(IDS.map((id) => ({ id, label: SIGNALS[id].label, group: SIGNALS[id].group, when: SIGNALS[id].when }))));

  return server;
}

const rpcError = (status, code, message) => Response.json({ jsonrpc: '2.0', error: { code, message }, id: null }, { status });

// Cloudflare Workers 진입점
export default {
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === '/health') return new Response('ok');
    if (path !== '/mcp') return new Response('Not found', { status: 404 });
    if (request.method !== 'POST') return rpcError(405, -32000, 'Method not allowed');
    // wrangler tail 로 vooy가 실제로 어떤 요청·도구를 부르는지 확인용
    request.clone().json().then((b) => console.log('rpc', [].concat(b).map((m) => m.method + (m.params?.name ? `:${m.params.name}` : '')).join(','))).catch(() => {});
    // stateless: 요청마다 새 서버·트랜스포트
    const server = buildServer();
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    try {
      await server.connect(transport);
      return await transport.handleRequest(request);
    } catch (err) {
      console.error(err);
      return rpcError(500, -32603, 'Internal error');
    }
  },
};
