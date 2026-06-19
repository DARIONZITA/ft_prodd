-- DropForeignKey
ALTER TABLE "TaskAssignment" DROP CONSTRAINT IF EXISTS "TaskAssignment_userId_fkey";

-- AlterTable
ALTER TABLE "TaskAssignment" ADD COLUMN "assignedById" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
