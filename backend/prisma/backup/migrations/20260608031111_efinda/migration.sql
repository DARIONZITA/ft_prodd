/*
  Warnings:

  - A unique constraint covering the columns `[taskId,userId]` on the table `TaskAssignment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_taskId_userId_key" ON "TaskAssignment"("taskId", "userId");
