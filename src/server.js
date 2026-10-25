import { createServer } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { SIGNALS, prepareFor } from './rules.js';

const IDS = Object.keys(SIGNALS);
const SIGNAL_LIST = IDS.map((id) => `${id}=${SIGNALS[id].label}(${SIGNALS[id].when})`).join('; ');

const INSTRUCTIONS = `과잉반응 대비 서버 (vooy 전용). 사용자가 묻기 전에 미리 대비시키는 게 목적.

언제: 아침 인사·브리핑, 오늘 날씨·뉴스 이야기, 여행·산행·캠핑·물놀이·행사 계획, 항공권·숙소 예약 이야기가 나오면 묻지 않아도 실행.
순서: 1) 한국 날씨로 사용자 위치(여행이면 목적지) 기온·특보·미세먼지 확인 2) Web Search 로 오늘 재난·사회 뉴스(지진, 산불, 파업, 단수, 정전, 감염병, 동네 범죄 등) 확인 3) 해당하는 신호를 모두 골라 prepare_for 호출 4) 결과의 assistant_instruction 대로 대비 할 일·구매 추천·대피/쉼터 장소 안내.
해당 신호가 없으면 "오늘은 대비할 것 없음" 한 줄. 위험을 지어내지 말 것. 구매·결제·예약은 반드시 사용자 확인 후.`;

const json = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });

function buildServer() {
  const server = new McpServer({ name: 'overreaction-prep', version: '2.0.0' }, { instructions: INSTRUCTIONS });

  server.registerTool('prepare_for', {
    title: '오늘 대비할 것',
    description: `오늘 날씨·뉴스·여행·일정에서 대비할 신호를 받아 미리 할 일, 구매 추천(다이소·다나와 등), 대피소·쉼터 검색어를 돌려줌. 아침 브리핑, 날씨·뉴스 이야기, 여행·산행·캠핑·물놀이·행사 계획, 예약 이야기가 나오면 사용자가 묻지 않아도 한국 날씨·Web Search 확인 후 호출. 신호(기준): ${SIGNAL_LIST}`,
    inputSchema: {
      signals: z.array(z.enum(IDS)).min(1).max(10).describe('해당하는 신호 id 전부'),
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

const httpServer = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  if (path === '/health') return res.end('ok');
  if (path !== '/mcp') return res.writeHead(404).end();
  if (req.method !== 'POST') {
    return res.writeHead(405, { 'Content-Type': 'application/json' })
      .end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed' }, id: null }));
  }
  // stateless: 요청마다 새 서버·트랜스포트
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => { transport.close(); server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
        .end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null }));
    }
  }
});

const port = Number(process.env.PORT) || 3000;
httpServer.listen(port, () => console.log(`overreaction-prep MCP on :${port}/mcp`));
