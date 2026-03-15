/*
  Warnings:

  - A unique constraint covering the columns `[normalizedName]` on the table `rooms` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `normalizedName` to the `rooms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "normalizedName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "rooms_normalizedName_key" ON "rooms"("normalizedName");
