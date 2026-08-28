-- CreateEnum
CREATE TYPE "businessType" AS ENUM ('audio', 'image');

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordCardFile" (
    "id" SERIAL NOT NULL,
    "wordCardId" INTEGER NOT NULL,
    "fileId" TEXT NOT NULL,
    "businessType" "businessType" NOT NULL,

    CONSTRAINT "WordCardFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_path_key" ON "File"("path");

-- CreateIndex
CREATE UNIQUE INDEX "WordCardFile_fileId_key" ON "WordCardFile"("fileId");

-- CreateIndex
CREATE INDEX "WordCardFile_wordCardId_idx" ON "WordCardFile"("wordCardId");

-- AddForeignKey
ALTER TABLE "WordCardFile" ADD CONSTRAINT "WordCardFile_wordCardId_fkey" FOREIGN KEY ("wordCardId") REFERENCES "WordCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordCardFile" ADD CONSTRAINT "WordCardFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
