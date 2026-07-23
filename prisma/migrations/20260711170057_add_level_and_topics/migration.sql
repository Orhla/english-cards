-- CreateEnum
CREATE TYPE "wordLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- AlterTable
ALTER TABLE "WordCard" ADD COLUMN     "level" "wordLevel";

-- CreateTable
CREATE TABLE "Topic" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TopicToWordCard" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TopicToWordCard_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TopicToWordCard_B_index" ON "_TopicToWordCard"("B");

-- AddForeignKey
ALTER TABLE "_TopicToWordCard" ADD CONSTRAINT "_TopicToWordCard_A_fkey" FOREIGN KEY ("A") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TopicToWordCard" ADD CONSTRAINT "_TopicToWordCard_B_fkey" FOREIGN KEY ("B") REFERENCES "WordCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
