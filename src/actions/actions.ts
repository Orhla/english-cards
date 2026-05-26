"use server"

import { prisma } from "@/lib/prisma"
import { WordCard } from "@/generated/prisma/browser";

type ActionGetCardsStatus =
    | { success: true, data: WordCard[] }
    | { success: false, message: string }

export async function getAllEnglishCards(): Promise<ActionGetCardsStatus> {
    try {
        const allCards = await prisma.wordCard.findMany();
        return {success: true, data: allCards};
    } catch (error) {
        return {success: false, message: error instanceof Error ? error.message : "Не удалось загрузить карточки. Попробуйте позже."}
        // вот тут имеет смысл обсудить: а. почему мы возвращаем объект, а не перебрасываем ошибку, почему дискриминейтед юнион тут хорош, как делают в ГО )))
    }
}
