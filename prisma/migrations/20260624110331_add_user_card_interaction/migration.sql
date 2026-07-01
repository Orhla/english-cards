-- CreateTable
CREATE TABLE "UserCardInteraction" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" INTEGER NOT NULL,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "ignored" BOOLEAN NOT NULL DEFAULT false,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCardInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCardInteraction_userId_cardId_key" ON "UserCardInteraction"("userId", "cardId");

-- AddForeignKey
ALTER TABLE "UserCardInteraction" ADD CONSTRAINT "UserCardInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCardInteraction" ADD CONSTRAINT "UserCardInteraction_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "WordCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
