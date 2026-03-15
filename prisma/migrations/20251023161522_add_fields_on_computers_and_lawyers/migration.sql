/*
  Warnings:

  - You are about to drop the column `remening_time` on the `computers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "computers" DROP COLUMN "remening_time",
ADD COLUMN     "current_lawyer_id" TEXT,
ADD COLUMN     "in_use" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "remaining_time" INTEGER;

-- AlterTable
ALTER TABLE "lawyers" ADD COLUMN     "last_access" TIMESTAMP(3),
ADD COLUMN     "remaining_time" INTEGER;
