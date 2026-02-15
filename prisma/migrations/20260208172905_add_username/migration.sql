/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `PendingUser` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `PendingUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable - Add username column with temporary default
ALTER TABLE "PendingUser" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Update existing rows with usernames derived from emails (part before @)
UPDATE "PendingUser" SET "username" = SPLIT_PART("email", '@', 1) WHERE "username" IS NULL;
UPDATE "User" SET "username" = SPLIT_PART("email", '@', 1) WHERE "username" IS NULL;

-- Make username NOT NULL
ALTER TABLE "PendingUser" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PendingUser_username_key" ON "PendingUser"("username");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
