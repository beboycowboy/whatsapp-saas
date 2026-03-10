ALTER TABLE "Company" ADD COLUMN "password" TEXT NOT NULL DEFAULT 'cambiar123';
ALTER TABLE "Company" ADD COLUMN "username" TEXT NOT NULL DEFAULT 'usuario';
ALTER TABLE "Company" ADD CONSTRAINT "Company_username_key" UNIQUE ("username");