-- CreateTable
CREATE TABLE "TaskAssignee" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectLeadershipTransfer" (
    "id" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "projectId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectLeadershipTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignee_taskId_userId_key" ON "TaskAssignee"("taskId", "userId");

-- CreateIndex
CREATE INDEX "TaskAssignee_userId_idx" ON "TaskAssignee"("userId");

-- CreateIndex
CREATE INDEX "ProjectLeadershipTransfer_projectId_idx" ON "ProjectLeadershipTransfer"("projectId");

-- CreateIndex
CREATE INDEX "ProjectLeadershipTransfer_toUserId_idx" ON "ProjectLeadershipTransfer"("toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectLeadershipTransfer_projectId_toUserId_status_key" ON "ProjectLeadershipTransfer"("projectId", "toUserId", "status");

-- Backfill task assignees from legacy column
INSERT INTO "TaskAssignee" ("id", "taskId", "userId")
SELECT md5(random()::text || clock_timestamp()::text), "id", "assignedToId"
FROM "Task"
WHERE "assignedToId" IS NOT NULL;

-- Drop legacy assignment column
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_assignedToId_fkey";
DROP INDEX IF EXISTS "Task_assignedToId_idx";
ALTER TABLE "Task" DROP COLUMN "assignedToId";

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLeadershipTransfer" ADD CONSTRAINT "ProjectLeadershipTransfer_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLeadershipTransfer" ADD CONSTRAINT "ProjectLeadershipTransfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLeadershipTransfer" ADD CONSTRAINT "ProjectLeadershipTransfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
