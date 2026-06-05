import { createWriteStream } from "fs";
import { AUDIO_DIR, ENGLISH_US_LANG_CODE, YANDEX_API_KEY, YANDEX_BASE_URL } from "@/lib/consts";
import { Writable } from "stream";
import { unlink } from "fs/promises";
import { WordCard } from "@/generated/prisma/browser";
import { access } from 'fs/promises';

export async function generateEnglishAudioFile(card: WordCard) {
    const audioPath = `${AUDIO_DIR}/${card.word}.ogg`
    try {
        await access(audioPath);
        return;
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
            throw error;
        }
    }
    
    const params = new URLSearchParams({
                        text: card.word,
                        lang: ENGLISH_US_LANG_CODE,
                        format: "oggopus",
                        voice: "john"
                    });
        
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
}