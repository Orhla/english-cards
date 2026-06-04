"use server"

import { prisma } from "@/lib/prisma"
import { WordCard } from "@/generated/prisma/browser";
import { createWriteStream, existsSync } from "fs";
import { AUDIO_DIR, YANDEX_API_KEY, YANDEX_BASE_URL } from "@/lib/consts";
import { Writable } from "stream";
import { unlink } from "fs/promises";

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

export async function generateEnglishAudioFile(card: WordCard) {
    const audioPath = `${AUDIO_DIR}/${card.word}.ogg`
    if (existsSync(audioPath)) {
        return;
    }
    
    const params = new URLSearchParams({
                        text: card.word,
                        lang: "en-US",
                        format: "oggopus",
                        voice: "john"
                    });
    
    try {
        const response = await fetch(YANDEX_BASE_URL, {
            method: "POST",
            headers: {
                "Authorization": `Api-Key ${YANDEX_API_KEY}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Yandex API Error (${response.status}): ${errText}`);
        }

        if (!response.body) {
            throw new Error("Пустой ответ от сервера Яндекса");
        }

        const fileStream = createWriteStream(audioPath);
        try {
            await response.body.pipeTo(Writable.toWeb(fileStream));
        } catch (error) {
            fileStream.destroy();
            try {
                await unlink(audioPath);
            } catch (unlinkError) {
                throw new Error(`Не удалось удалить файл: ${audioPath}\nОшибка: ${unlinkError}`);
            }
            throw new Error(`Ошибка генерации аудиофайла ${audioPath}\nОшибка: ${error}`)
        }
    } catch (error) {
        console.error(error instanceof Error ? error.message : "Ошибка записи звука");
        throw new Error("Ошибка записи звука");
    }
}