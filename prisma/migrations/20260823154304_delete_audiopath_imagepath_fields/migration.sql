/*
  Warnings:

  - You are about to drop the column `audioPath` on the `WordCard` table. All the data in the column will be lost.
  - You are about to drop the column `imagePath` on the `WordCard` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WordCard" DROP COLUMN "audioPath",
DROP COLUMN "imagePath";
