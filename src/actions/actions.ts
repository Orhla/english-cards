"use server"

import { prisma } from "@/lib/prisma"
import { WordCard, partOfSpeech } from "@/generated/prisma/browser";
import { redirect } from "next/navigation";
import { requireAdmin, requireLogin } from "@/lib/dal";
import { revalidatePath } from "next/cache";
import { ERRORS_PER_NEW } from "@/lib/consts";

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
    await requireAdmin();
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
  await requireAdmin();
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
        return { success: false, error: `Не удалось сохранить изменения: ${error instanceof Error ? error.message : error}` };
  }
}


export async function deleteWordCard(cardId: number) {
  await requireAdmin();
  try {
    await prisma.wordCard.delete({
      where: { id: cardId },
    });

    return { success: true };
  } catch (error) {
        console.error("Ошибка при удалении карточки:", error);
        return { success: false, error: `Не удалось удалить карточку: ${error instanceof Error ? error.message : error}` };
  }
}


export async function createWordCard(card: Omit<WordCard, 'id'>) {
  await requireAdmin();
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
        return { success: false, error: `Не удалось создать карточку: ${error instanceof Error ? error.message : error}` };
  }

  if (isSuccess) {
    redirect('/admin/cards');
  }
}


export async function likeCard(cardId: number) {
  const session = await requireLogin();
  const userId = session.user.id;
  try {
    await prisma.userCardInteraction.upsert({
        where: { userId_cardId: { userId, cardId } },
        create: { userId, cardId, liked: true },
        update: { liked: true, ignored: false },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
      console.error("Ошибка при лайке карточки:", error);
      return { success: false, error: `Не удалось лайкнуть карточку: ${error instanceof Error ? error.message : error}` };
  }
}


export async function ignoreCard(cardId: number) {
  const session = await requireLogin();
  const userId = session.user.id;
  try {
    await prisma.userCardInteraction.upsert({
        where: { userId_cardId: { userId, cardId } },
        create: { userId, cardId, ignored: true },
        update: { liked: false, ignored: true },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
      console.error("Ошибка при добавлении карточки в игнор:", error);
      return { success: false, error: `Не удалось добавить карточку в игнор: ${error instanceof Error ? error.message : error}` };
  }
}


export async function recordAnswer(cardId: number, isCorrect: boolean) {
  const session = await requireLogin();
  const userId = session.user.id;
  try {
    await prisma.userCardInteraction.upsert({
        where: { userId_cardId: { userId, cardId } },
        create: { userId,
                  cardId, 
                  correctCount: isCorrect ? 1 : 0,
                  incorrectCount: isCorrect ? 0 : 1},
        update: { correctCount: isCorrect ? {increment: 1} : {increment: 0},
                  incorrectCount: isCorrect ? {increment: 0} : {increment: 1},
                  lastSeenAt: new Date() },
    });
    return { success: true };
  } catch (error) {
      console.error("Ошибка при обновлении статистики правильных ответов:", error);
      return { success: false, error: `Ошибка при обновлении статистики правильных ответов: ${error instanceof Error ? error.message : error}` };
  }
}


export async function getCardsForPractice(userId: string): Promise<ActionGetCardsStatus> {
  try {
    // cards with user errors
    
    const errorInteractions = await prisma.userCardInteraction.findMany({
      where: { userId, incorrectCount: { gt: 0 }, ignored: false },
      orderBy: [{ liked: 'desc' }, { incorrectCount: 'desc' }, { lastSeenAt: 'asc' }],
      include: { card: true },
    })

    const errorCards = errorInteractions.map(interaction => interaction.card);

    // cards not seen by user
    const seenCardIds = await prisma.userCardInteraction.findMany({
        where: { userId },
        select: { cardId: true },
    })

    const newCards = await prisma.wordCard.findMany({
        where: { id: { notIn: seenCardIds.map(r => r.cardId) } },
        orderBy: { id: 'asc' },
    })

    const result = [];
    const arrErrorCards = [...errorCards];
    const arrNewCards = [...newCards];
    let errorIndex = 0;
    let newIndex = 0;

    while (arrErrorCards.length > errorIndex || arrNewCards.length > newIndex) {
        const remainingErrors = arrErrorCards.length - errorIndex;
        const remainingNews = arrNewCards.length - newIndex;

        if (remainingErrors === 0 && remainingNews === 0) {
           break;
        }

        if (remainingErrors > 0 && remainingNews === 0) {
            result.push(...arrErrorCards.slice(errorIndex));
            break;
        }

        if (remainingNews > 0 && remainingErrors === 0) {
            result.push(...arrNewCards.slice(newIndex));
            break;
        }

        const errorLimit = Math.min(remainingErrors, ERRORS_PER_NEW[0]);
        for (let i = 0; i < errorLimit; i++) {
            result.push(arrErrorCards[errorIndex]);
            errorIndex++;
        }

        const newLimit = Math.min(remainingNews, ERRORS_PER_NEW[1]);
        for (let i = 0; i < newLimit; i++) {
            result.push(arrNewCards[newIndex]);
            newIndex++;
        }
    }
    return {success: true, data: result};
  } catch (error) {
    return {success: false, message: error instanceof Error ? error.message : "Не удалось загрузить карточки. Попробуйте позже."};
  }

}