/*
  Warnings:

  - A unique constraint covering the columns `[fortyTwoId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_nickname_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fortyTwoId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "User_fortyTwoId_key" ON "User"("fortyTwoId");
