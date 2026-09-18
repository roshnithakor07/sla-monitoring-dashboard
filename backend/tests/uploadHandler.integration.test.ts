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

  it('re-uploading the exact same file content is detected and not re-persisted', async () => {
    const filename = 'reupload-test.csv';
    // Distinct content from the shared `csv` constant used elsewhere in this
    // file, so this test's own hash check isn't affected by upload order.
    const reuploadCsv = [
      header,
      'svc-notify,notify-worker,2025-05-14T08:00:00Z,200,120,ms,agent-1,ap-south-1',
    ].join('\n');

    const first = await handler(buildEvent(reuploadCsv, { 'x-filename': filename }));
    const firstSummary = JSON.parse(first.body as string);
    expect(firstSummary.acceptedRows).toBe(1);
    expect(firstSummary.duplicateRows).toBe(0);
    expect(firstSummary.duplicateOfImport).toBeUndefined();

    const second = await handler(buildEvent(reuploadCsv, { 'x-filename': filename }));
    const secondSummary = JSON.parse(second.body as string);
    expect(secondSummary.acceptedRows).toBe(0);
    expect(secondSummary.duplicateRows).toBe(1);
    expect(secondSummary.duplicateOfImport.filename).toBe(filename);

    // Only ONE DatasetImport row exists for this filename -- the second
    // upload never created a second one.
    const imports = await prisma.datasetImport.findMany({ where: { filename } });
    expect(imports).toHaveLength(1);

    const totalPersisted = await prisma.monitoringCheck.count({
      where: { datasetImport: { filename } },
    });
    expect(totalPersisted).toBe(1); // not 2

    createdImportIds.push(imports[0].id);
  });

  it('does NOT treat different content that happens to share a service+timestamp+agent as a duplicate', async () => {
    // Regression test for the row-level-dedup approach that was tried and
    // reverted: two DIFFERENT files can legitimately contain a check for
    // the same service+timestamp+agent with a different latency (this is
    // exactly what happens with the 5 real supplied files, which have
    // overlapping date ranges). Both uploads must be fully persisted.
    const csvA = [
      header,
      'svc-reports,reports-api,2025-06-10T09:00:00Z,200,200,ms,agent-1,ap-south-1',
    ].join('\n');
    const csvB = [
      header,
      'svc-reports,reports-api,2025-06-10T09:00:00Z,200,450,ms,agent-1,ap-south-1',
    ].join('\n');

    const resultA = await handler(buildEvent(csvA, { 'x-filename': 'collision-a.csv' }));
    const summaryA = JSON.parse(resultA.body as string);
    expect(summaryA.acceptedRows).toBe(1);

    const resultB = await handler(buildEvent(csvB, { 'x-filename': 'collision-b.csv' }));
    const summaryB = JSON.parse(resultB.body as string);
    expect(summaryB.acceptedRows).toBe(1); // NOT skipped as a duplicate

    const rows = await prisma.monitoringCheck.findMany({
      where: {
        serviceId: 'svc-reports',
        timestamp: new Date('2025-06-10T09:00:00Z'),
        agent: 'agent-1',
      },
    });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.latencyMs).sort()).toEqual([200, 450]);

    const importA = await prisma.datasetImport.findFirst({ where: { filename: 'collision-a.csv' } });
    const importB = await prisma.datasetImport.findFirst({ where: { filename: 'collision-b.csv' } });
    createdImportIds.push(importA!.id, importB!.id);
  });
});
