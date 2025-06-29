-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('Owner', 'Editor', 'Commenter', 'Viewer');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "owner_id" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Document_Permissions" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER NOT NULL,
    "permission_level" "Permission" NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Document_id_key" ON "Document"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Document_Permissions_id_key" ON "Document_Permissions"("id");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document_Permissions" ADD CONSTRAINT "Document_Permissions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
