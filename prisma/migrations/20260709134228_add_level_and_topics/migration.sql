-- CreateEnum
CREATE TYPE "wordLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'other');

-- CreateEnum
CREATE TYPE "topic" AS ENUM ('abstract', 'appearance', 'city_life', 'clothes', 'communication', 'culture', 'education', 'emotions', 'entertainment', 'family', 'food', 'health', 'home', 'law', 'media', 'money', 'nature', 'personality', 'politics', 'science', 'shopping', 'society', 'sport', 'time', 'technology', 'travel', 'weather', 'work', 'other');

-- AlterTable
ALTER TABLE "WordCard" ADD COLUMN     "level" "wordLevel" NOT NULL DEFAULT 'other',
ADD COLUMN     "topics" "topic"[] DEFAULT ARRAY[]::"topic"[];
