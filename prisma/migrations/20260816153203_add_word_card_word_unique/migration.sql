/*
  Warnings:

  - A unique constraint covering the columns `[word]` on the table `WordCard` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WordCard_word_key" ON "WordCard"("word");
