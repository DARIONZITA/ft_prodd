-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'taskUpdated';
ALTER TYPE "NotificationType" ADD VALUE 'taskDeleted';
ALTER TYPE "NotificationType" ADD VALUE 'workspaceInvite';
ALTER TYPE "NotificationType" ADD VALUE 'friendRequest';
ALTER TYPE "NotificationType" ADD VALUE 'friendRequestAccepted';
ALTER TYPE "NotificationType" ADD VALUE 'friendRequestRejected';
ALTER TYPE "NotificationType" ADD VALUE 'friendRemoved';
