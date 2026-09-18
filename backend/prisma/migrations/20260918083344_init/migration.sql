-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DataQualityStatus" AS ENUM ('CLEAN', 'INVALID_STATUS', 'LATENCY_MISSING', 'LATENCY_INVALID');

-- CreateTable
CREATE TABLE "DatasetImport" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRows" INTEGER NOT NULL,
    "acceptedRows" INTEGER NOT NULL,
    "rejectedRows" INTEGER NOT NULL,
    "duplicateRows" INTEGER NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'COMPLETED',

    CONSTRAINT "DatasetImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringCheck" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "latencyMs" DOUBLE PRECISION,
    "agent" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "dataQualityStatus" "DataQualityStatus" NOT NULL DEFAULT 'CLEAN',
    "datasetImportId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitoringCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DatasetImport_uploadedAt_idx" ON "DatasetImport"("uploadedAt");

-- CreateIndex
CREATE INDEX "MonitoringCheck_timestamp_idx" ON "MonitoringCheck"("timestamp");

-- CreateIndex
CREATE INDEX "MonitoringCheck_serviceId_idx" ON "MonitoringCheck"("serviceId");

-- CreateIndex
CREATE INDEX "MonitoringCheck_statusCode_idx" ON "MonitoringCheck"("statusCode");

-- CreateIndex
CREATE INDEX "MonitoringCheck_serviceId_timestamp_idx" ON "MonitoringCheck"("serviceId", "timestamp");

-- AddForeignKey
ALTER TABLE "MonitoringCheck" ADD CONSTRAINT "MonitoringCheck_datasetImportId_fkey" FOREIGN KEY ("datasetImportId") REFERENCES "DatasetImport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
