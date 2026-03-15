-- DropForeignKey
ALTER TABLE "public"."tokens" DROP CONSTRAINT "tokens_employee_id_fkey";

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "avatar_public_id" TEXT;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
