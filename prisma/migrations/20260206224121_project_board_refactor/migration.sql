/*
  Warnings:

  - You are about to drop the column `status` on the `Task` table. All the data in the column will be lost.
  - Added the required column `statusId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "Status" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "order" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Status_userId_order_idx" ON "Status"("userId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Status_userId_name_key" ON "Status"("userId", "name");

-- CreateIndex
CREATE INDEX "Project_userId_statusId_idx" ON "Project"("userId", "statusId");

-- AddForeignKey
ALTER TABLE "Status" ADD CONSTRAINT "Status_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create default statuses for each user
INSERT INTO "Status" ("id", "name", "order", "userId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'To Do',
    0,
    "id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User";

INSERT INTO "Status" ("id", "name", "order", "userId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'In Progress',
    1,
    "id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User";

INSERT INTO "Status" ("id", "name", "order", "userId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'Done',
    2,
    "id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User";

-- Add new columns to Task table
ALTER TABLE "Task" 
ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "projectId" TEXT,
ADD COLUMN "statusId" TEXT;

-- Migrate existing task statuses to new Status system
UPDATE "Task" t
SET "statusId" = s."id"
FROM "Status" s
WHERE t."userId" = s."userId"
  AND t."status" = 'TODO'
  AND s."name" = 'To Do';

UPDATE "Task" t
SET "statusId" = s."id"
FROM "Status" s
WHERE t."userId" = s."userId"
  AND t."status" = 'IN_PROGRESS'
  AND s."name" = 'In Progress';

UPDATE "Task" t
SET "statusId" = s."id"
FROM "Status" s
WHERE t."userId" = s."userId"
  AND t."status" = 'DONE'
  AND s."name" = 'Done';

-- Make statusId required after data migration
ALTER TABLE "Task" ALTER COLUMN "statusId" SET NOT NULL;

-- Drop old status column
ALTER TABLE "Task" DROP COLUMN "status";

-- DropEnum
DROP TYPE "TaskStatus";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_userId_fkey";

-- CreateIndex
CREATE INDEX "Task_userId_statusId_idx" ON "Task"("userId", "statusId");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
