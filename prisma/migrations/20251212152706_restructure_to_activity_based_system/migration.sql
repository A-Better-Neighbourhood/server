/*
  Warnings:

  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'AUTHORITY', 'ADMIN');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'AUTHORITY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('ROAD_ISSUE', 'GARBAGE', 'STREET_LIGHT', 'WATER_LEAK', 'NOISE_COMPLAINT', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('REPORT_CREATED', 'USER_COMMENTED', 'AUTHORITY_COMMENTED', 'STATUS_UPDATED', 'DUPLICATE_MERGED', 'MARKED_RESOLVED', 'MARKED_AS_DUPLICATE', 'UPVOTE_MILESTONE');

-- AlterEnum
ALTER TYPE "ReportStatus" ADD VALUE 'ARCHIVED';

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_userId_fkey";

-- DropTable
DROP TABLE "Report";

-- DropTable
DROP TABLE "user";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactNo" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT[],
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "originalReportId" TEXT,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "mergedAt" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "actorType" "ActorType" NOT NULL DEFAULT 'USER',
    "content" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "oldStatus" TEXT,
    "newStatus" TEXT,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upvotes" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upvotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_contactNo_key" ON "users"("contactNo");

-- CreateIndex
CREATE INDEX "reports_latitude_longitude_idx" ON "reports"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "reports_originalReportId_idx" ON "reports"("originalReportId");

-- CreateIndex
CREATE INDEX "reports_isDuplicate_status_idx" ON "reports"("isDuplicate", "status");

-- CreateIndex
CREATE INDEX "activities_reportId_createdAt_idx" ON "activities"("reportId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "upvotes_reportId_userId_key" ON "upvotes"("reportId", "userId");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_originalReportId_fkey" FOREIGN KEY ("originalReportId") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upvotes" ADD CONSTRAINT "upvotes_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upvotes" ADD CONSTRAINT "upvotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
