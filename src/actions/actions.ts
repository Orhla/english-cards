"use server"

import { prisma } from "@/lib/prisma"
import { WordCard, partOfSpeech } from "@/generated/prisma/browser";
import { redirect } from "next/navigation";

type ActionGetCardsStatus =
    | { success: true, data: WordCard[] }
    | { success: false, message: string }

export async function getAllEnglishCards(): Promise<ActionGetCardsStatus> {
    try {
        const allCards = await prisma.wordCard.findMany();
        // момент в том, что сейчас все карточки выдаются в одном и том же формате. нам же надо какую-то рандомизацию. представь 20.000 карточек и нам нужно рандомно каждый раз выдавать.
        return {success: true, data: allCards};
    } catch (error) {
        return {success: false, message: error instanceof Error ? error.message : "Не удалось загрузить карточки. Попробуйте позже."}
        // вот тут имеет смысл обсудить: а. почему мы возвращаем объект, а не перебрасываем ошибку, почему дискриминейтед юнион тут хорош, как делают в ГО )))
    }
}

export async function wordCardFormAction(prevState: unknown, formData: FormData): Promise<{ error?: string } | null> {
    const id = formData.get("id")?.toString();
    const word = formData.get("word")?.toString().trim() ?? "";
    const transcription = formData.get("transcription")?.toString().trim() ?? "";
    const translation = formData.getAll("translation").map(String).filter(Boolean);
    const meaning = formData.getAll("meaning").map(String).filter(Boolean);
    const examples = formData.getAll("example").map(String).filter(Boolean);
    const partsOfSpeech = formData.getAll("partsOfSpeech").map(String) as partOfSpeech[];

    const audioFile = formData.get("audio") as File | null;
    if (audioFile && audioFile.size > 0) {
        console.log("audio file:", audioFile.name, "size:", audioFile.size, "bytes");
    } else {
        console.log("audio file: not provided");
    }

    try {
        if (id) {
            await prisma.wordCard.update({
                where: { id: Number(id) },
                data: { word, transcription, translation, meaning, examples, partsOfSpeech },
            });
        } else {
            await prisma.wordCard.create({
                data: { word, transcription, translation, meaning, examples, partsOfSpeech },
            });
        }
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Не удалось сохранить карточку" };
    }

    redirect("/admin/cards");
}


export async function updateWordCard(card: WordCard) {
  try {
    await prisma.wordCard.update({
      where: { id: card.id },
      data: {
        word: card.word,
        partsOfSpeech: card.partsOfSpeech,
        transcription: card.transcription,
        translation: card.translation,
        meaning: card.meaning,
        examples: card.examples,
      },
    });

    return { success: true };
  } catch (error) {
        console.error("Ошибка при обновлении карточки:", error);
        return { success: false, error: `Не удалось сохранить изменения: ${error}` };
  }
}


export async function deleteWordCard(cardId: number) {
  try {
    await prisma.wordCard.delete({
      where: { id: cardId },
    });

    return { success: true };
  } catch (error) {
        console.error("Ошибка при удалении карточки:", error);
        return { success: false, error: `Не удалось удалить карточку: ${error}` };
  }
}


export async function createWordCard(card: Omit<WordCard, 'id'>) {
  let isSuccess = false;
  try {
    await prisma.wordCard.create({
      data: {
        word: card.word,
        transcription: card.transcription,
        translation: card.translation,
        meaning: card.meaning,
        examples: card.examples,
        partsOfSpeech: card.partsOfSpeech,
      },
    });
    isSuccess = true;
  } catch (error) {
        console.error("Ошибка при создании карточки:", error);
        return { success: false, error: `Не удалось создать карточку: ${error}` };
  }

  if (isSuccess) {
    redirect('/admin/cards');
  }
}
