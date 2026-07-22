-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('active', 'completed', 'archived');

-- CreateTable
CREATE TABLE "records" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "records_status_idx" ON "records"("status");

-- CreateIndex
CREATE INDEX "records_title_idx" ON "records"("title");

-- CreateIndex
CREATE INDEX "records_createdAt_idx" ON "records"("createdAt");

-- CreateIndex
CREATE INDEX "application_events_type_idx" ON "application_events"("type");

-- CreateIndex
CREATE INDEX "application_events_createdAt_idx" ON "application_events"("createdAt");
