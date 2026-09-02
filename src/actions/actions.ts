"use server"

import { prisma } from "@/lib/prisma"
import { WordCard, businessType, partOfSpeech } from "@/generated/prisma/browser";
import { redirect } from "next/navigation";
import { requireAdmin, requireLogin } from "@/lib/dal";
import { revalidatePath } from "next/cache";
import { AUDIO_DIR, ERROR_CARDS_NUMBER, LANGUAGES, MAX_CARDS_NUMBER, MIN_CARDS_NUMBER, NEW_CARDS_NUMBER, STORAGE_DIR } from "@/lib/consts";
import { WordCardWithInteractions } from "@/lib/types";
import { logger } from "@/lib/logger";
import path from "path";
import { generateEnglishAudioFile } from "@/lib/yandex-generate-audio";
import {uploadFileService, ValidationError} from "@/services/files";

const actionLogger = logger.child({component: "actions.ts"})

type ActionGetCardsStatus =
    | { success: true, data: WordCardWithInteractions[] }
    | { success: false, message: string }

export async function getAllEnglishCards(userId?: string): Promise<ActionGetCardsStatus> {
    try {
        const allCards = await prisma.wordCard.findMany({
          include: {
            interactions: {
              where: userId ? { userId } : { userId: "" }
            },
            topics: true
          }
        });
        // момент в том, что сейчас все карточки выдаются в одном и том же формате. нам же надо какую-то рандомизацию. представь 20.000 карточек и нам нужно рандомно каждый раз выдавать.
        return {success: true, data: allCards};
    } catch (error) {
        return {success: false, message: error instanceof Error ? error.message : "Не удалось загрузить карточки. Попробуйте позже."}
        // вот тут имеет смысл обсудить: а. почему мы возвращаем объект, а не перебрасываем ошибку, почему дискриминейтед юнион тут хорош, как делают в ГО )))
    }
}

export type WordCardFormPayload = {
    id?: string
    word: string
    transcription: string
    translation: string[]
    meaning: string[]
    example: string[]
    partsOfSpeech: partOfSpeech[]
    topics: string[]
    audioFiles : { id: string}[]
    imageFiles: { id: string}[]
}

export async function wordCardFormAction(prevState: unknown, data: WordCardFormPayload): Promise<{ error?: string } | null> {
    const session = await requireAdmin();
    console.log("wordCardFormAction called with data:", data);

    const { id, word, transcription, translation, meaning, example, partsOfSpeech, topics, audioFiles, imageFiles } = data;

    try {
        // if (id) {
          await prisma.$transaction(async (tx) => {
              const card = id
                  ? await tx.wordCard.update({
                  where: {id: Number(id)},
                  data: {
                      word,
                      transcription,
                      translation,
                      meaning,
                      examples: example,
                      partsOfSpeech,
                      topics: {
                          set: [],
                          connect: topics.map((topicName) => ({name: topicName})),
                      },
                  },
              })
                  : await tx.wordCard.create({
                  data: { word,
                      transcription,
                      translation,
                      meaning,
                      examples: example,
                      partsOfSpeech,
                      topics: {
                          connect: topics.map((topicName) => ({ name: topicName })),
                      },
                  },
              });


              await tx.wordCardFile.deleteMany({
                  where: { wordCardId: card.id }
              });

              await tx.wordCardFile.createMany({
                  data: audioFiles.map(f => ({
                      wordCardId: card.id,
                      fileId: f.id,
                      businessType: "audio"
                  }))
              });

              await tx.wordCardFile.createMany({
                  data: imageFiles.map(f => ({
                      wordCardId: card.id,
                      fileId: f.id,
                      businessType: "image"
                  }))
              });
          });
            // 1. delete all files associated with this wordCard. 2. create new links between wordCard and files. If we do this in one transaction, then this is OK
            // todo: update links between wordCard and files. We need not only create new links, but we should also remove old ones that are not in the new list.


        // } else {
        //     await prisma.$transaction(async (tx) => {
        //         const createdCard = await tx.wordCard.create({
        //             data: { word,
        //                     transcription,
        //                     translation,
        //                     meaning,
        //                     examples: example,
        //                     partsOfSpeech,
        //                     topics: {
        //                         connect: topics.map((topicName) => ({ name: topicName })),
        //                     },
        //             },
        //         });
        //
        //         await tx.wordCardFile.deleteMany({
        //             where: { wordCardId: createdCard.id }
        //         });
        //
        //         await tx.wordCardFile.createMany({
        //             data: audioFiles.map(f => ({
        //                 wordCardId: createdCard.id,
        //                 fileId: f.id,
        //                 businessType: "audio"
        //             }))
        //         });
        //
        //         await tx.wordCardFile.createMany({
        //             data: imageFiles.map(f => ({
        //                 wordCardId: createdCard.id,
        //                 fileId: f.id,
        //                 businessType: "image"
        //             }))
        //         });
        //   });
        // }

        actionLogger.debug("Форма сохранения карточки отправлена", {
            function: "wordCardFormAction",
            userId: session.user.id
        });
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Не удалось сохранить карточку" };
    }

    redirect("/admin/cards");
}


export async function updateWordCard(card: WordCard) {
  const session = await requireAdmin();

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
    actionLogger.debug("Карточка слова обновлена", {
        function: "updateWordCard",
        userId: session.user.id,
        cardId: card.id,
        cardWord: card.word
    });

    return { success: true };
  } catch (error) {
        actionLogger.error("Ошибка при обновлении карточки", {function: "updateWordCard", error: `${error instanceof Error ? error.message : error}`});
        return { success: false, error: `Не удалось сохранить изменения: ${error instanceof Error ? error.message : error}` };
  }
}


export async function deleteWordCard(cardId: number) {
  const session = await requireAdmin();

  try {
    await prisma.wordCard.delete({
      where: { id: cardId },
    });
    actionLogger.debug("Карточка удалена", {
        function: "deleteWordCard",
        userId: session.user.id,
        cardId: cardId,
    });

    return { success: true };
  } catch (error) {
        actionLogger.error("Ошибка при удалении карточки", {function: "deleteWordCard", error: `${error instanceof Error ? error.message : error}`});
        return { success: false, error: `Не удалось удалить карточку: ${error instanceof Error ? error.message : error}` };
  }
}


export async function createWordCard(card: Omit<WordCard, 'id'>) {
  const session = await requireAdmin();

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
    actionLogger.debug("Карточка слова создана", {
        function: "createWordCard",
        userId: session.user.id,
        cardWord: card.word,
    });
  } catch (error) {
        actionLogger.error("Ошибка при создании карточки", {function: "createWordCard", error: `${error instanceof Error ? error.message : error}`});
        return { success: false, error: `Не удалось создать карточку: ${error instanceof Error ? error.message : error}` };
  }

  if (isSuccess) {
    redirect('/admin/cards');
  }
}


export async function likeCard(cardId: number, nextState: boolean) {
  const session = await requireLogin();
  const userId = session.user.id;

  try {
    await prisma.userCardInteraction.upsert({
        where: { userId_cardId: { userId, cardId } },
        create: { userId, cardId, liked: true },
        update: { liked: nextState },
    });
    actionLogger.debug("Нажата кнопка лайка", {
        function: "likeCard",
        userId: userId,
        cardId: cardId,
    });
    revalidatePath("/practice");
    return { success: true };
  } catch (error) {
      actionLogger.error("Ошибка при лайке карточки", {function: "likeCard", error: `${error instanceof Error ? error.message : error}`});
      return { success: false, error: `Не удалось лайкнуть карточку: ${error instanceof Error ? error.message : error}` };
  }
}


export async function ignoreCard(cardId: number, nextState: boolean) {
  const session = await requireLogin();
  const userId = session.user.id;

  try {
    await prisma.userCardInteraction.upsert({
        where: { userId_cardId: { userId, cardId } },
        create: { userId, cardId, ignored: true },
        update: { ignored: nextState },
    });
    actionLogger.debug("Нажата кнопка игнора", {
        function: "ignoreCard",
        userId: userId,
        cardId: cardId,
    });
    revalidatePath("/practice");
    return { success: true };
  } catch (error) {
      actionLogger.error("Ошибка при добавлении карточки в игнор", {function: "ignoreCard", error: `${error instanceof Error ? error.message : error}`});
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
    actionLogger.debug("Нажата кнопка записи голоса в режиме Практика", {
        function: "recordAnswer",
        userId: userId,
        cardId: cardId,
    });
    return { success: true };
  } catch (error) {
      actionLogger.error("Ошибка при обновлении статистики правильных ответов", {function: "recordAnswer", error: `${error instanceof Error ? error.message : error}`});
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
            },
            topics: true,
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
          },
          topics: true,
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
    result.sort(() => Math.random() - 0.5)
    return {success: true, data: result};
  } catch (error) {
    return {success: false, message: error instanceof Error ? error.message : "Не удалось загрузить карточки. Попробуйте позже."};
  }

}


let cache: { value: string[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function getAllTopics(): Promise<string[]> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.value
  }
  try {
      const allTopics = await prisma.topic.findMany({
        select: {
          name: true,
        }
      });
      const allTopicsArray = allTopics.map(topic => topic.name);
      cache = { value: allTopicsArray, expiresAt: Date.now() + CACHE_TTL_MS }
      return allTopicsArray;
  } catch (error) {
      actionLogger.error("Ошибка при получении названий топиков", {function: "getAllTopics", error: `${error instanceof Error ? error.message : error}`});
      return ["other"];
  }
}


export async function generateWordAudio(word: string): Promise<{audioPath: string}> {
  try {
    const card = await prisma.wordCard.findUniqueOrThrow({
      where: { word }
    });
    await generateEnglishAudioFile(card, LANGUAGES.ENGLISH_US_LANG_CODE);

    const safeWord = path.basename(word).replace(/[\/\\?%*:|"<>]/g, '-');
    const audioPath = path.join(STORAGE_DIR, AUDIO_DIR, `${safeWord}.ogg`);

    try {
      await prisma.wordCard.update({
        where: { id: card.id },
        data: {
          audioPath: audioPath
        },
      });
    } catch (error) {
      actionLogger.error("Не удалось обновить карточку", {function: "generateWordAudio", error: `${error instanceof Error ? error.message : error}`});
      throw new Error(`Не удалось обновить карточку: ${error instanceof Error ? error.message : error}`);
    }
    return {audioPath};
  } catch (error) {
    actionLogger.warn("Карточка со словом не найдена", {function: "generateWordAudio", error: `${error instanceof Error ? error.message : error}`});
    throw new Error(`Карточка со словом не найдена: ${error instanceof Error ? error.message : error}`);
  }
}


export async function uploadFile(file: File, businessType: "audio" | "image"): Promise<{ id: string, originalName: string } | {error: string}> {
  const session = await requireAdmin();
  try {
    const uploadedFile = await uploadFileService(file, businessType);
    return uploadedFile;
  } catch (error) {
      actionLogger.error("Не удалось загрузить файл", {function: "uploadFile", error: `${error instanceof Error ? error.message : error}`});

      if (error instanceof ValidationError) {
          return { error: error.message };
      }
      return { error: "Неизвестная ошибка при записи файла" };
  }
}
