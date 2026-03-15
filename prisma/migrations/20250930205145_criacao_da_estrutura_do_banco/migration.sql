-- CreateEnum
CREATE TYPE "public"."Roles" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."TokenTypes" AS ENUM ('PASSWORD_RECOVER');

-- CreateTable
CREATE TABLE "public"."tokens" (
    "id" TEXT NOT NULL,
    "type" "public"."TokenTypes" NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "employee_id" TEXT NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar_url" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "public"."Roles" NOT NULL DEFAULT 'USER',
    "inactive" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employees_rooms" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employee_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,

    CONSTRAINT "employees_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "standard_time" INTEGER NOT NULL DEFAULT 180,
    "remening_time" INTEGER,
    "description" TEXT NOT NULL,
    "inactive" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."computers" (
    "id" TEXT NOT NULL,
    "mac_code" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "maintenance" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "room_id" TEXT NOT NULL,

    CONSTRAINT "computers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."computer_sessions" (
    "id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "computer_id" TEXT NOT NULL,
    "lawyer_id" TEXT NOT NULL,

    CONSTRAINT "computer_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lawyers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "oab" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "birth" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lawyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."printers" (
    "id" TEXT NOT NULL,
    "url_file" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "computer_id" TEXT NOT NULL,
    "lawyer_id" TEXT NOT NULL,

    CONSTRAINT "printers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_code_key" ON "public"."tokens"("code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_cpf_key" ON "public"."employees"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "public"."employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_rooms_employee_id_room_id_key" ON "public"."employees_rooms"("employee_id", "room_id");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_name_key" ON "public"."rooms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "computers_mac_code_key" ON "public"."computers"("mac_code");

-- CreateIndex
CREATE UNIQUE INDEX "lawyers_cpf_key" ON "public"."lawyers"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "lawyers_oab_key" ON "public"."lawyers"("oab");

-- CreateIndex
CREATE UNIQUE INDEX "lawyers_email_key" ON "public"."lawyers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "printers_url_file_key" ON "public"."printers"("url_file");

-- AddForeignKey
ALTER TABLE "public"."tokens" ADD CONSTRAINT "tokens_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees_rooms" ADD CONSTRAINT "employees_rooms_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees_rooms" ADD CONSTRAINT "employees_rooms_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."computers" ADD CONSTRAINT "computers_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."computer_sessions" ADD CONSTRAINT "computer_sessions_computer_id_fkey" FOREIGN KEY ("computer_id") REFERENCES "public"."computers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."computer_sessions" ADD CONSTRAINT "computer_sessions_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "public"."lawyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."printers" ADD CONSTRAINT "printers_computer_id_fkey" FOREIGN KEY ("computer_id") REFERENCES "public"."computers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."printers" ADD CONSTRAINT "printers_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "public"."lawyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
