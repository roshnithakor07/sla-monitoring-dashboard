import type { ImportSummary, NormalizedCheckRow } from '../types';
import { prisma } from './prismaClient';

/**
 * Persists one processed upload: a DatasetImport summary row plus its
 * cleaned MonitoringCheck rows, in a single transaction so a partially
 * inserted batch can never be visible to dashboard queries.
 */
export async function persistImport(summary: ImportSummary, rows: NormalizedCheckRow[]) {
  return prisma.$transaction(async (tx) => {
    const datasetImport = await tx.datasetImport.create({
      data: {
        filename: summary.filename,
        totalRows: summary.totalRows,
        acceptedRows: summary.acceptedRows,
        rejectedRows: summary.rejectedRows,
        duplicateRows: summary.duplicateRows,
        status: 'COMPLETED',
      },
    });

    if (rows.length > 0) {
      await tx.monitoringCheck.createMany({
        data: rows.map((row) => ({
          serviceId: row.serviceId,
          serviceName: row.serviceName,
          timestamp: row.timestamp,
          statusCode: row.statusCode,
          latencyMs: row.latencyMs,
          agent: row.agent,
          region: row.region,
          dataQualityStatus: row.dataQualityStatus,
          datasetImportId: datasetImport.id,
        })),
      });
    }

    return datasetImport;
  });
}
