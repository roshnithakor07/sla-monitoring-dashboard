import http from 'node:http';
import { URL } from 'node:url';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { handler as uploadHandler } from '../handlers/upload';
import { handler as statsHandler } from '../handlers/stats';
import { handler as logsHandler } from '../handlers/logs';

/**
 * Local stand-in for API Gateway, used only for `npm run dev`. It adapts a
 * plain Node HTTP request into the same APIGatewayProxyEventV2 shape the
 * real deployed Lambda receives, and calls the exact same handler
 * functions -- so local testing exercises real code paths, not a
 * reimplementation. This process is not part of the deployed architecture;
 * production traffic goes through the actual AWS Lambda + API Gateway.
 */
const PORT = Number(process.env.PORT ?? 3001);

const ROUTES: Record<string, (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>> = {
  '/api/upload': uploadHandler,
  '/api/stats': statsHandler,
  '/api/logs': logsHandler,
};

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function toEvent(req: http.IncomingMessage, body: string, url: URL): APIGatewayProxyEventV2 {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers[key] = value;
  }

  const queryStringParameters: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryStringParameters[key] = value;
  });

  return {
    version: '2.0',
    routeKey: `${req.method} ${url.pathname}`,
    rawPath: url.pathname,
    rawQueryString: url.search.replace(/^\?/, ''),
    headers,
    queryStringParameters,
    requestContext: {
      http: { method: req.method ?? 'GET', path: url.pathname },
    } as APIGatewayProxyEventV2['requestContext'],
    body,
    isBase64Encoded: false,
  } as APIGatewayProxyEventV2;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const handlerFn = ROUTES[url.pathname];

  if (!handlerFn) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `No route for ${url.pathname}` }));
    return;
  }

  const body = await readBody(req);
  const event = toEvent(req, body, url);
  const result = await handlerFn(event);

  if (typeof result === 'string') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(result);
    return;
  }

  res.writeHead(result.statusCode ?? 200, (result.headers as Record<string, string>) ?? {});
  res.end(typeof result.body === 'string' ? result.body : JSON.stringify(result.body ?? {}));
});

server.listen(PORT, () => {
  console.log(`Local API server listening on http://localhost:${PORT}`);
});
