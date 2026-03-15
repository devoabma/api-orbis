/*
  Warnings:

  - You are about to drop the column `remening_time` on the `rooms` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "computers" ADD COLUMN     "remening_time" INTEGER;

-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "remening_time";
