"use server"

import { prisma } from "@/lib/prisma"
import { WordCard, partOfSpeech } from "@/generated/prisma/browser";
import { redirect } from "next/navigation";
import { requireAdmin, requireLogin } from "@/lib/dal";
import { revalidatePath } from "next/cache";
import { ERROR_CARDS_NUMBER, MAX_CARDS_NUMBER, MIN_CARDS_NUMBER, NEW_CARDS_NUMBER } from "@/lib/consts";
import { WordCardWithInteractions } from "@/lib/types";

type ActionGetCardsStatus =
    | { success: true, data: WordCardWithInteractions[] }
    | { success: false, message: string }

export async function getAllEnglishCards(userId?: string): Promise<ActionGetCardsStatus> {
    try {
        const allCards = await prisma.wordCard.findMany({
          include: {
            interactions: {
              where: userId ? { userId } : { userId: "" }
            }
          }
        });
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


export async function likeCard(cardId: number, nextState?: boolean) {
  const session = await requireLogin();
  const userId = session.user.id;
  try {
    await prisma.userCardInteraction.upsert({
        where: { userId_cardId: { userId, cardId } },
        create: { userId, cardId, liked: true },
        update: { liked: nextState },
    });
    revalidatePath("/practice");
    return { success: true };
  } catch (error) {
      console.error("Ошибка при лайке карточки:", error);
      return { success: false, error: `Не удалось лайкнуть карточку: ${error instanceof Error ? error.message : error}` };
  }
}


export async function ignoreCard(cardId: number, nextState?: boolean) {
  const session = await requireLogin();
  const userId = session.user.id;
  try {
    await prisma.userCardInteraction.upsert({
        where: { userId_cardId: { userId, cardId } },
        create: { userId, cardId, ignored: true },
        update: { ignored: nextState },
    });
    revalidatePath("/practice");
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
        update: { [isCorrect ? 'correctCount' : 'incorrectCount']: { increment: 1 },
                  lastSeenAt: new Date() },
    });
    return { success: true };
  } catch (error) {
      console.error("Ошибка при обновлении статистики правильных ответов:", error);
      return { success: false, error: `Ошибка при обновлении статистики правильных ответов: ${error instanceof Error ? error.message : error}` };
  }
}


export async function getCardsForPractice(userId: string, limit: number = 10): Promise<ActionGetCardsStatus> {
  if (!Number.isInteger(limit)) {
    limit = 10;
  }

  if (limit < MIN_CARDS_NUMBER) {
    limit = MIN_CARDS_NUMBER;
  }

  if (limit > MAX_CARDS_NUMBER) {
    limit = MAX_CARDS_NUMBER;
  }

  const errorCardsNumber = Math.round(limit / (ERROR_CARDS_NUMBER + NEW_CARDS_NUMBER) * ERROR_CARDS_NUMBER);
  const newCardsNumber = limit - errorCardsNumber;

  try {
    // cards with user errors
    
    const errorInteractions = await prisma.userCardInteraction.findMany({
      where: { userId, incorrectCount: { gt: 0 }, ignored: false },
      orderBy: [{ liked: 'desc' }, { incorrectCount: 'desc' }, { lastSeenAt: 'asc' }],
      include: {
        card: {
          include: {
            interactions: {
              where: { userId } 
            }
          }
        }
      },
      take: errorCardsNumber,
    })

    const errorCards = errorInteractions.map(interaction => interaction.card);

    const newCards = await prisma.wordCard.findMany({
        where: {
          interactions: {
            none: {
              userId
            }
          }
        },
        include: {
          interactions: {
            where: { userId }
          }
        },
        orderBy: { id: 'asc' },
        take: newCardsNumber,
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

        const errorLimit = Math.min(remainingErrors, ERROR_CARDS_NUMBER);
        for (let i = 0; i < errorLimit; i++) {
            result.push(arrErrorCards[errorIndex]);
            errorIndex++;
        }

        const newLimit = Math.min(remainingNews, NEW_CARDS_NUMBER);
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