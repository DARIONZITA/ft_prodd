/*
  Warnings:

  - The values [taskUpdated,taskDeleted,workspaceInvite,friendRequest,friendRequestAccepted,friendRequestRejected,friendRemoved] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `text` on the `ChecklistItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[workspaceId,userId]` on the table `WorkspaceMember` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `description` to the `ChecklistItem` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `color` on the `Label` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `creatorId` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assignedById` to the `TaskAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ColumnType" AS ENUM ('backlog', 'todo', 'in_progress', 'code_review', 'done', 'custom');

-- CreateEnum
CREATE TYPE "LabelColor" AS ENUM ('red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'cyan', 'teal', 'indigo', 'lime', 'gray', 'brown');

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('friendship', 'workspace', 'task', 'mention', 'taskAssignment', 'comment', 'invite');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "ChecklistItem" DROP COLUMN "text",
ADD COLUMN     "description" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Column" ADD COLUMN     "columnType" "ColumnType" NOT NULL DEFAULT 'custom';

-- AlterTable
ALTER TABLE "Label" DROP COLUMN "color",
ADD COLUMN     "color" "LabelColor" NOT NULL;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "creatorId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "TaskAssignment" ADD COLUMN     "assignedById" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
