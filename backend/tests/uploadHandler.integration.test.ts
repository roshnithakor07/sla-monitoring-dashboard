import { afterAll, describe, expect, it } from 'vitest';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../src/handlers/upload';
import { prisma } from '../src/repositories/prismaClient';

// Hits the real Neon database configured via backend/.env. Cleans up its own
// rows afterward so it doesn't pollute the shared dev/prod database with
// synthetic test data.
const header = 'service_id,service_name,timestamp,status_code,latency,latency_unit,agent,region';
const csv = [
  header,
  'svc-auth,auth-api,2025-05-13T12:45:00Z,200,150,ms,agent-1,ap-south-1',
  'svc-auth,auth-api,2025-05-13T13:00:00Z,999,116,ms,agent-1,ap-south-1',
  'svc-search,search-api,2025-05-13T13:15:00Z,200,0.486,s,agent-1,ap-south-1',
].join('\n');

function buildEvent(body: string, headers: Record<string, string> = {}): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'POST /api/upload',
    rawPath: '/api/upload',
    rawQueryString: '',
    headers,
    requestContext: {
      http: { method: 'POST', path: '/api/upload' },
    } as APIGatewayProxyEventV2['requestContext'],
    body,
    isBase64Encoded: false,
  } as APIGatewayProxyEventV2;
}

describe('upload handler (integration, real Neon database)', () => {
  const createdImportIds: string[] = [];

  afterAll(async () => {
    for (const id of createdImportIds) {
      await prisma.monitoringCheck.deleteMany({ where: { datasetImportId: id } });
      await prisma.datasetImport.delete({ where: { id } });
    }
    await prisma.$disconnect();
  });

  it('parses, cleans, persists, and returns a dynamic summary', async () => {
    const result = await handler(buildEvent(csv, { 'x-filename': 'integration-test.csv' }));

    expect(result.statusCode).toBe(200);
    const summary = JSON.parse(result.body as string);
    expect(summary.totalRows).toBe(3);
    expect(summary.acceptedRows).toBe(3);
    expect(summary.dataQuality.invalidStatus).toBe(1);

    const persisted = await prisma.datasetImport.findFirst({
      where: { filename: 'integration-test.csv' },
      orderBy: { uploadedAt: 'desc' },
      include: { checks: true },
    });
    expect(persisted).not.toBeNull();
    expect(persisted!.checks).toHaveLength(3);
    expect(persisted!.totalRows).toBe(3);

    const search = persisted!.checks.find((c) => c.serviceId === 'svc-search');
    expect(search?.latencyMs).toBe(486);

    createdImportIds.push(persisted!.id);
  });

  it('rejects an empty body', async () => {
    const result = await handler(buildEvent(''));
    expect(result.statusCode).toBe(400);
  });

  it('rejects a CSV missing required columns', async () => {
    const result = await handler(buildEvent('foo,bar\n1,2'));
    expect(result.statusCode).toBe(400);
  });
});
