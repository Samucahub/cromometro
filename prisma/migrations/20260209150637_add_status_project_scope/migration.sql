/*
  Warnings:

  - A unique constraint covering the columns `[userId,name,projectId]` on the table `Status` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Status_userId_name_key";

-- AlterTable
ALTER TABLE "Status" ADD COLUMN     "projectId" TEXT;

-- CreateIndex
CREATE INDEX "Status_projectId_order_idx" ON "Status"("projectId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Status_userId_name_projectId_key" ON "Status"("userId", "name", "projectId");
